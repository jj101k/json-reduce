import { Local } from "./Base"
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
        const symbolMatch = /^([[\]{},:\s\r\n]*)([a-z]+|0|-?[1-9][0-9]*(?:[.][0-9]+)?(?:e[+-][1-9][0-9]*)?|"[^"\\]*(?:\\.[^"\\]*)*")/
        const subtokenMatch = /([a-zA-Z0-9]+)/g
        const popularTokens = this.popularTokens(contentsShort, symbolMatch, subtokenMatch)

        yield popularTokens.subtokenBlock + "\n\n"

        for(const tokenInfo of popularTokens.tokens) {
            let buffer = ""
            for(const chunk of tokenInfo.chunks) {
                const pre = tokenInfo.token.substring(chunk.pre.start, chunk.pre.finish)
                const post = popularTokens.subtokenOffsets[chunk.post].toString(36)
                buffer += pre + post
                if(buffer.length > 65536) {
                    yield buffer
                    buffer = ""
                }
            }
            yield buffer + tokenInfo.token.substring(tokenInfo.lastMatchEnd, contentsShort.length) + "\n"
        }
        yield "\n"

        let buffer = ""
        for (const chunk of popularTokens.chunks) {
            const pre = contentsShort.substring(chunk.pre.start, chunk.pre.finish)
            const post = popularTokens.tokenOffsets[chunk.post].toString(36)
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
}