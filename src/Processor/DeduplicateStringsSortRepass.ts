import { DeduplicateStringsRepass } from "./DeduplicateStringsRepass"

export class DeduplicateStringsSortRepass extends DeduplicateStringsRepass {
    static *encode(contents: string) {
        const contentsShort = this.shortenIfNeeded(contents)
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const ordered = this.orderedPopularTokens(contentsShort, stringMatch)
        const orderedI = ordered.tokens.map(([k]) => k).join("\n")

        const wordMatch = /([a-z0-9]+)/gi
        const orderedW = this.orderedPopularTokens(orderedI, wordMatch)
        yield orderedW.tokens.map(([k]) => k).join("\n") + "\n\n"

        yield *this.replaceSymbolsIn(orderedI, orderedW)
        yield "\n\n"
        yield *this.replaceSymbolsIn(contentsShort, ordered)
    }
}