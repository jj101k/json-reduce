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
    *replaceSymbolsIn(contents: string, tokens: { chunks: { pre: [number, number], post: number }[], tokens: [string, number][], lastMatchEnd: number }) {
        const tokenRefOffsets = tokens.tokens.map(([_, i], offset) => [i, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset)

        for (const t of tokens.chunks) {
            const pre = contents.substring(t.pre[0], t.pre[1])
            const post = tokenRefOffsets[t.post].toString(36)
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
        let m
        let lastMatchEnd = 0
        const re = /([a-z0-9]+)/g
        while (m = re.exec(body)) {
            const pre = body.substring(lastMatchEnd, re.lastIndex - m[1].length)
            lastMatchEnd = re.lastIndex
            const post = strings[parseInt(m[1], 36)]
            yield pre + post
        }
        yield body.substring(lastMatchEnd, body.length)
    }

    *decode(contents: string) {
        const [header, body] = contents.split(/\n\n/)
        const strings = header.split("\n")
        yield *this.replaceSymbolsOut(body, strings)
    }
}