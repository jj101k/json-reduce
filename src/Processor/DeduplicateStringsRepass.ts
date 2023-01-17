import { Local } from "./Local"

export class DeduplicateStringsRepass extends Local {
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

    static *encode(contents: string) {
        const contentsShort = this.shortenIfNeeded(contents)
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const ordered = this.popularTokens(contentsShort, stringMatch)
        const orderedI = ordered.tokens.map(([k]) => k).join("\n")

        const wordMatch = /([a-z0-9]+)/gi
        const orderedW = this.popularTokens(orderedI, wordMatch)
        yield orderedW.tokens.map(([k]) => k).join("\n") + "\n\n"

        yield *this.replaceSymbolsIn(orderedI, orderedW)
        yield "\n\n"
        yield *this.replaceSymbolsIn(contentsShort, ordered)
    }
}