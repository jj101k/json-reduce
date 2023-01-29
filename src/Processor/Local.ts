/**
 *
 */
export abstract class Local {
    /**
     *
     */
    private lastChunk: {uid: string, chunk: string} | null = null

    /**
     *
     */
    protected debug = false

    /**
     *
     * @param contents
     */
    protected abstract encodeInner(contents: string): Generator<string, string>

    /**
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
     *
     * @param contents
     */
    abstract decodeBlock(contents: string): Generator<string, number>

    /**
     *
     * @param contents
     */
    *encode(contents: string) {
        const endChunk = yield *this.encodeInner(contents)
        yield endChunk
    }

    /**
     *
     * @param contents
     * @param uid
     */
    *encodeBlock(contents: string, uid: string) {
        const contentsExtended = this.lastChunk ? this.lastChunk.chunk + contents : contents
        this.lastChunk = null
        const endChunk = yield *this.encodeInner(contentsExtended)
        this.lastChunk = {uid, chunk: endChunk}
    }

    /**
     *
     * @param uid
     * @returns
     */
    encodeFinish(uid: string) {
        const lastChunk = this.lastChunk
        if(lastChunk?.uid != uid) {
            throw new Error(`Wrong chunk: ${uid} != ${lastChunk?.uid}`)
        }

        this.lastChunk = null
        return lastChunk.chunk
    }
}