/**
 *
 */
export abstract class Local {
    /**
     *
     */
    private lastChunk: {uid: string, chunk: string} | null = null

    /**
     * Encodes `contents` as a block. If you call this multiple times,
     * non-matching contents at the end of the last block will be picked up in
     * this one.
     *
     * @param contents
     * @param uid Used to detect repeat blocks.
     */
    private *encodeBlock(contents: string, uid: string) {
        const contentsExtended = this.lastChunk ? this.lastChunk.chunk + contents : contents
        this.lastChunk = null
        const endChunk = yield *this.encodeInner(contentsExtended)
        this.lastChunk = {uid, chunk: endChunk}
    }

    /**
     * If you've called encodeBlock(), this returns any remaining chunk at the end.
     *
     * @param uid
     * @returns
     */
    private encodeFinish(uid: string) {
        const lastChunk = this.lastChunk
        if(lastChunk?.uid != uid) {
            throw new Error(`Wrong chunk: ${uid} != ${lastChunk?.uid}`)
        }

        this.lastChunk = null
        return lastChunk.chunk
    }

    /**
     *
     */
    protected debug = false

    /**
     * Yields with the block contents, then returns the relative offset at which
     * the next block would start.
     *
     * @param contents
     */
    protected abstract decodeBlock(contents: string): Generator<string, number>

    /**
     * Encodes (a block), with any trailling content returned.
     *
     * @param contents
     */
    protected abstract encodeInner(contents: string): Generator<string, string>

    /**
     * If `contents` looks like pretty-printed JSON, returns it in non-pretty form.
     *
     * @param contents
     * @returns
     */
    protected shortenIfNeeded(contents: string) {
        if (contents.match(/^[\[{]\r?\n/s)) {
            return contents.replace(/\n\s*"((?:[^"]*\\.)*)":\s+/g, `"$1"`).replace(/\r?\n\s*/g, "")
        } else {
            return contents
        }
    }

    /**
     * Decodes (yields) the encoded content, handling blocks as appropriate.
     *
     * @param contents
     */
    *decode(contents: string) {
        let offset = 0
        do {
            contents = contents.substring(offset)
            offset = yield *this.decodeBlock(contents)
        } while(offset < contents.length)
    }

    /**
     * Encodes the given contents (yield). If there's trailling opaque content,
     * it will be yielded at the end.
     *
     * @param contents
     */
    *encode(contents: string) {
        const endChunk = yield *this.encodeInner(contents)
        yield endChunk
    }

    /**
     * Encodes from stream to stream.
     *
     * @param fd Eg. from fsPromises.open()
     * @param out Eg. NodeJS.WriteStream (like process.stdout)
     */
    async encodeStream(fd: {read(bufferConfig: {buffer: Buffer}): Promise<{bytesRead: number}>}, out: {write(content: string): any}) {
        let handlerChunks: Generator<string>
        const buffer = Buffer.alloc(65536)
        const uid = "" + Math.random()
        let totalLength = 0
        let outerChunkNumber: number
        let bytesRead = (await fd.read({buffer})).bytesRead
        for(outerChunkNumber = 0; bytesRead > 0; bytesRead = (await fd.read({buffer})).bytesRead, outerChunkNumber++) {
            if(outerChunkNumber > 0) {
                out.write("\n\n")
            }
            outerChunkNumber++
            const inputChunk = buffer.toString("utf-8", 0, bytesRead)
            handlerChunks = this.encodeBlock(inputChunk, uid)
            for(const chunk of handlerChunks) {
                totalLength += chunk.length
                out.write(chunk)
            }
        }
        out.write(this.encodeFinish(uid))
        if(this.debug) {
            console.warn(`${outerChunkNumber} outer chunks totalling ${totalLength} bytes`)
        }
    }
}