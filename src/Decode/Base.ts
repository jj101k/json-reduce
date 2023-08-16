/**
 *
 */
export abstract class Base {
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
}