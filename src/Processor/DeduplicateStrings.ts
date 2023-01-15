import { Local } from "./Local"

export class DeduplicateStrings extends Local {
    static *encode(contents: string) {
        const contentsShort = this.shortenIfNeeded(contents)
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const seen = this.popularTokens(contentsShort, stringMatch)
        yield seen.join("\n") + "\n\n"
        yield *this.replaceSymbolsIn(contentsShort, stringMatch, seen)
    }
    static *decode(contents: string) {
        const [header, body] = contents.split(/\n\n/)
        const strings = header.split("\n")
        yield *this.replaceSymbolsOut(body, strings)
    }
}