import { Local } from "./Local"

export class MultiPass extends Local {
    /**
     *
     * @param contents
     * @param tokens
     * @returns
     */
    static *replaceSymbolsIn(contents: string, tokens: { chunks: { pre: [number, number], post: number }[], tokens: [string, number][], lastMatchEnd: number }) {
        const tokenRefOffsets = tokens.tokens.map(([_, i], offset) => [i, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset)

        for (const t of tokens.chunks) {
            const pre = contents.substring(t.pre[0], t.pre[1])
            const post = tokenRefOffsets[t.post].toString(36)
            yield pre + post
        }
        yield contents.substring(tokens.lastMatchEnd, contents.length)
    }

    static *replaceSymbolsOut(body: string, strings: string[]) {
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

    static *decode(contents: string) {
        const [header1, header2, body] = contents.split(/\n\n/)
        const strings1 = header1.split("\n")

        let stringsI = ""
        for(const o of this.replaceSymbolsOut(header2, strings1)) {
            stringsI += o
        }

        const strings = stringsI.split("\n")

        yield *this.replaceSymbolsOut(body, strings)
    }
}