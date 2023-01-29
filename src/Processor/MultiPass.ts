import { Local } from "./Local"
import { PopularTokens } from "./PopularTokens"

/**
 *
 */
export abstract class MultiPass extends Local {
    /**
     *
     * @param contents
     * @param findTokens
     * @param findSubtokens
     * @returns
     */
    abstract popularTokens(contents: string, findTokens: RegExp, findSubtokens: RegExp): PopularTokens

    *encodeInner(contents: string) {
        const contentsShort = this.shortenIfNeeded(contents)

        // Quoted strings, or barewords like "true", or numbers
        const symbolMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const subtokenMatch = /([a-zA-Z0-9]+)/g
        const popularTokens = this.popularTokens(contentsShort, symbolMatch, subtokenMatch)

        yield popularTokens.subtokenBlock + "\n\n"

        for(const t of popularTokens.tokens) {
            let buffer = ""
            for(const c of t.chunks) {
                const pre = t.token.substring(c.pre.start, c.pre.finish)
                const post = popularTokens.subtokenOffsets[c.post].toString(36)
                buffer += pre + post
            }
            yield buffer + t.token.substring(t.lastMatchEnd, contentsShort.length) + "\n"
        }
        yield "\n\n"

        let buffer = ""
        for (const t of popularTokens.chunks) {
            const pre = contentsShort.substring(t.pre.start, t.pre.finish)
            const post = popularTokens.tokenOffsets[t.post].toString(36)
            buffer += pre + post
            if(buffer.length > 65536) {
                yield buffer
                buffer = ""
            }
        }
        if(buffer.length > 0) {
            yield buffer
        }
        return contentsShort.substring(popularTokens.lastMatchEnd)
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

    decode(contents: string) {
        const [header1, header2, body] = contents.split(/\n\n/)
        const strings1 = header1.split("\n")

        let stringsI = ""
        for(const o of this.replaceSymbolsOut(header2, strings1)) {
            stringsI += o
        }

        const strings = stringsI.split("\n")

        return this.replaceSymbolsOut(body, strings)
    }
}