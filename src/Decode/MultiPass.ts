import { Local } from "./Base"

/**
 *
 */
export class MultiPass extends Local {
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