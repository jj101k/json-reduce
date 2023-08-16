import { Base } from "./Base"

/**
 *
 */
export class SinglePass extends Base {
    /**
     *
     * @param body
     * @param strings
     */
    private *replaceSymbolsOut(body: string, strings: string[]) {
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
        const internalSeparator = "\n\n"
        const externalSeparator = "\n\n"
        const [header, body] = contents.split(internalSeparator, 2)
        const strings = header.split("\n")
        yield *this.replaceSymbolsOut(body, strings)
        return header.length + internalSeparator.length + body.length + externalSeparator.length
    }
}