import { Chunk } from "../Chunk"
import { Base as EncodeBase } from "../Base"

/**
 *
 */
export abstract class Base extends EncodeBase {
    /**
     *
     * @param contents
     * @param tokens
     * @returns
     */
    protected *replaceSymbolsIn(contents: string, tokens: { chunks: Chunk[], tokens: [string, number][], lastMatchEnd: number }) {
        const tokenRefOffsets = tokens.tokens.map(([_, i], offset) => [i, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset)

        for (const chunk of tokens.chunks) {
            const pre = contents.substring(chunk.pre.start, chunk.pre.finish)
            const post = tokenRefOffsets[chunk.post].toString(36)
            yield pre + post
        }
        return contents.substring(tokens.lastMatchEnd, contents.length)
    }
}