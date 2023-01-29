import { Local } from "./Local"
import { PopularTokens } from "./PopularTokens"

/**
 *
 */
export abstract class MultiPass extends Local {
    /**
     *
     * @param body
     * @param strings
     */
    private *replaceSymbolsOut(body: string, strings: string[]) {
        let m
        let lastMatchEnd = 0
        const base36Match = /([a-z0-9]+)/g
        let buffer = ""
        while (m = base36Match.exec(body)) {
            const pre = body.substring(lastMatchEnd, base36Match.lastIndex - m[1].length)
            lastMatchEnd = base36Match.lastIndex
            const post = strings[parseInt(m[1], 36)]

            buffer += pre + post
            if(buffer.length > 65536) {
                yield buffer
                buffer = ""
            }
        }
        yield buffer + body.substring(lastMatchEnd, body.length)
    }

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
                if(buffer.length > 65536) {
                    yield buffer
                    buffer = ""
                }
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

    decode(contents: string) {
        const [subtokenBlock, tokenBlockIn, body] = contents.split(/\n\n/)
        const subtokens = subtokenBlock.split("\n")

        let tokenBlock = ""
        for(const o of this.replaceSymbolsOut(tokenBlockIn, subtokens)) {
            tokenBlock += o
        }

        const tokens = tokenBlock.split("\n")

        return this.replaceSymbolsOut(body, tokens)
    }
}