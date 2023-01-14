const child_process = require("child_process")

class Processors {
    static replaceSymbolsIn(contents, re, strings) {
        const r = new Map([...strings].map((m, i) => [m, i]))
        return contents.replace(re, (_, $1) => r.get($1).toString(36))
    }
    static replaceSymbolsOut(body, strings) {
        return body.replace(/([a-z0-9]+)/g, (_, $1) => strings[parseInt($1, 36)])
    }
    static popularTokens(contents, re) {
        const seen = new Set()
        for (const m of contents.matchAll(re)) {
            if(!seen.has(m[1])) {
                seen.add(m[1])
            }
        }
        return [...seen]
    }
    static deduplicateStringsIn(contents) {
        const contentsShort = JSON.stringify(JSON.parse(contents))
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const seen = this.popularTokens(contentsShort, stringMatch)
        let out = seen.join("\n") + "\n\n"
        out += this.replaceSymbolsIn(contentsShort, stringMatch, seen)

        return out
    }
    static deduplicateStringsOut(contents) {
        const [header, body] = contents.split(/\n\n/)
        const strings = header.split("\n")
        return this.replaceSymbolsOut(body, strings)
    }

    static deduplicateStringsSortIn(contents) {
        const contentsShort = JSON.stringify(JSON.parse(contents))
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const ordered = this.orderedPopularTokens(contentsShort, stringMatch)
        let out = ordered.join("\n") + "\n\n"
        out += this.replaceSymbolsIn(contentsShort, stringMatch, ordered)

        return out
    }

    static deduplicateStringsRepassOut(contents) {
        const [header1, header2, body] = contents.split(/\n\n/)
        const strings1 = header1.split("\n")
        const strings = this.replaceSymbolsOut(header2, strings1).split("\n")
        return this.replaceSymbolsOut(body, strings)
    }

    static orderedPopularTokens(contents, re) {
        const seen = new Map()
        for (const m of contents.matchAll(re)) {
            seen.set(m[1], (seen.get(m[1]) ?? 0) + 1)
        }

        return [...seen.entries()].sort(([ak, av], [bk, bv]) => +bv-av).map(([k]) => k)
    }
    static deduplicateStringsSortRepassIn(contents) {
        const contentsShort = JSON.stringify(JSON.parse(contents))
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const ordered = this.orderedPopularTokens(contentsShort, stringMatch)
        const orderedI = ordered.join("\n")

        const wordMatch = /([a-z0-9]+)/gi
        const orderedW = this.orderedPopularTokens(orderedI, wordMatch)
        let out = orderedW.join("\n") + "\n\n"

        out += this.replaceSymbolsIn(orderedI, wordMatch, orderedW) + "\n\n"
        out += this.replaceSymbolsIn(contentsShort, stringMatch, ordered)

        return out
    }

    static deduplicateStringsRepassIn(contents) {
        const contentsShort = JSON.stringify(JSON.parse(contents))
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const ordered = this.popularTokens(contentsShort, stringMatch)
        const orderedI = ordered.join("\n")

        const wordMatch = /([a-z0-9]+)/gi
        const orderedW = this.popularTokens(orderedI, wordMatch)
        let out = orderedW.join("\n") + "\n\n"

        out += this.replaceSymbolsIn(orderedI, wordMatch, orderedW) + "\n\n"
        out += this.replaceSymbolsIn(contentsShort, stringMatch, ordered)

        return out
    }

    static referenceIn(contents) {
        return child_process.execSync("gzip -c", {input: contents, maxBuffer: 100_000_000}).toString("base64")
    }

    static referenceOut(contents) {
        return child_process.execSync("gzip -cd", {input: Buffer.from(contents, "base64"), encoding: "utf-8", maxBuffer: 100_000_000})
    }
}

module.exports = Processors