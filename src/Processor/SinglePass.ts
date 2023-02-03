import { Chunk } from "./Chunk"
import { Local } from "./Local"

/**
 *
 */
export abstract class SinglePass extends Local {
    /**
     *
     * @param contents
     * @param tokens
     * @returns
     */
    *replaceSymbolsIn(contents: string, tokens: { chunks: Chunk[], tokens: [string, number][], lastMatchEnd: number }) {
        const tokenRefOffsets = tokens.tokens.map(([_, i], offset) => [i, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset)

        for (const chunk of tokens.chunks) {
            const pre = contents.substring(chunk.pre.start, chunk.pre.finish)
            const post = tokenRefOffsets[chunk.post].toString(36)
            yield pre + post
        }
        return contents.substring(tokens.lastMatchEnd, contents.length)
    }

    /**
     *
     * @param body
     * @param strings
     */
    *replaceSymbolsOut(body: string, strings: string[]) {
        let match: RegExpMatchArray | null
        let lastMatchEnd = 0
        const re = /([a-z0-9]+)/g
        while (match = re.exec(body)) {
            const pre = body.substring(lastMatchEnd, re.lastIndex - match[1].length)
            lastMatchEnd = re.lastIndex
            const post = strings[parseInt(match[1], 36)]
            yield pre + post
        }
        yield body.substring(lastMatchEnd, body.length)
    }

    *decodeBlock(contents: string) {
        const [header, body] = contents.split("\n\n", 2)
        const strings = header.split("\n")
        yield *this.replaceSymbolsOut(body, strings)
        return header.length + 2 + body.length + 2
    }
}