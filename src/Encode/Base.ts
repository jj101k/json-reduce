/**
 *
 */
export abstract class Base {
    /**
     *
     */
    private lastChunk: string | null = null

    /**
     * Encodes `contents` as a block. If you call this multiple times,
     * non-matching contents at the end of the last block will be picked up in
     * this one.
     *
     * @param contents
     */
    private *encodeBlock(contents: string) {
        const contentsExtended = this.lastChunk ? this.lastChunk + contents : contents
        this.lastChunk = null
        this.lastChunk = yield *this.encodeInner(contentsExtended)
    }

    /**
     * If you've called encodeBlock(), this returns any remaining chunk at the end.
     *
     * @returns
     */
    private encodeFinish() {
        const lastChunk = this.lastChunk
        if(lastChunk === null) {
            throw new Error("Last chunk unset, has encodeBlock() been used?")
        }

        this.lastChunk = null
        return lastChunk
    }

    /**
     *
     */
    protected debug = false

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
        let totalLength = 0
        let outerChunkNumber: number
        let bytesRead = (await fd.read({buffer})).bytesRead
        for(outerChunkNumber = 0; bytesRead > 0; bytesRead = (await fd.read({buffer})).bytesRead, outerChunkNumber++) {
            if(outerChunkNumber > 0) {
                out.write("\n\n")
            }
            outerChunkNumber++
            const inputChunk = buffer.toString("utf-8", 0, bytesRead)
            handlerChunks = this.encodeBlock(inputChunk)
            for(const chunk of handlerChunks) {
                totalLength += chunk.length
                out.write(chunk)
            }
        }
        out.write(this.encodeFinish())
        if(this.debug) {
            console.warn(`${outerChunkNumber} outer chunks totalling ${totalLength} bytes`)
        }
    }
}