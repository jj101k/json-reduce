const DeduplicateStringsRepass = require("./DeduplicateStringsRepass")

class DeduplicateStringsSortRepass extends DeduplicateStringsRepass {
    static *encode(contents) {
        const contentsShort = this.shortenIfNeeded(contents)
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const ordered = this.orderedPopularTokens(contentsShort, stringMatch)
        const orderedI = ordered.join("\n")

        const wordMatch = /([a-z0-9]+)/gi
        const orderedW = this.orderedPopularTokens(orderedI, wordMatch)
        yield orderedW.join("\n") + "\n\n"

        yield *this.replaceSymbolsIn(orderedI, wordMatch, orderedW)
        yield "\n\n"
        yield *this.replaceSymbolsIn(contentsShort, stringMatch, ordered)
    }
}

module.exports = DeduplicateStringsSortRepass