const DeduplicateStrings = require("./DeduplicateStrings")

class DeduplicateStringsSort extends DeduplicateStrings {
    static *encode(contents) {
        const contentsShort = this.shortenIfNeeded(contents)
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const ordered = this.orderedPopularTokens(contentsShort, stringMatch)
        yield ordered.tokens.map(([k]) => k).join("\n") + "\n\n"
        yield *this.replaceSymbolsInX(contentsShort, stringMatch, ordered)
    }
}

module.exports = DeduplicateStringsSort