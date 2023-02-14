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
        let match: RegExpMatchArray | null
        let lastMatchEnd = 0
        const base36Match = /([a-z0-9]+)/g
        let buffer = ""
        while (match = base36Match.exec(body)) {
            const ref = match[1]
            const pre = body.substring(lastMatchEnd, base36Match.lastIndex - ref.length)
            lastMatchEnd = base36Match.lastIndex
            const post = strings[parseInt(ref, 36)]
            if(post === undefined) {
                throw new Error(`Internal error: token "${ref}" is not defined at ...${body.substring(base36Match.lastIndex - ref.length - 10, base36Match.lastIndex + 10)}...`)
            }

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

    *decodeBlock(contents: string) {
        const internalSeparator = "\n\n"
        const externalSeparator = "\n\n"
        const [subtokenBlock, tokenBlockIn, body] = contents.split(internalSeparator, 3)
        const subtokens = subtokenBlock.split("\n")

        let tokenBlock = ""
        for(const chunk of this.replaceSymbolsOut(tokenBlockIn, subtokens)) {
            tokenBlock += chunk
        }

        const tokens = tokenBlock.split("\n")

        yield *this.replaceSymbolsOut(body, tokens)

        return subtokenBlock.length + internalSeparator.length +
            tokenBlockIn.length + internalSeparator.length + body.length +
            externalSeparator.length
    }
}