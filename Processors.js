const child_process = require("child_process")

class Processors {
    static replaceSymbolsIn(contents, re, strings) {
        const r = new Map([...strings].map((m, i) => [m, i]))
        return contents.replace(re, (_, $1) => r.get($1).toString(36))
    }
    static replaceSymbolsOut(body, strings) {
        return body.replace(/([a-z0-9]+)/g, (_, $1) => strings[parseInt($1, 36)])
    }
    static deduplicateStringsIn(contents) {
        const contentsShort = JSON.stringify(JSON.parse(contents))
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const seen = new Set()
        let out = ""
        for (const m of contentsShort.matchAll(stringMatch)) {
            if(!seen.has(m[1])) {
                seen.add(m[1])
                out += m[1] + "\n"
            }
        }
        out += "\n"
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
        const seen = new Map()
        for (const m of contentsShort.matchAll(stringMatch)) {
            seen.set(m[1], (seen.get(m[1]) ?? 0) + 1)
        }

        const ordered = [...seen.entries()].sort(([ak, av], [bk, bv]) => +bv-av).map(([k]) => k)
        let out = ordered.join("\n") + "\n\n"
        out += this.replaceSymbolsIn(contentsShort, stringMatch, ordered)

        return out
    }

    static deduplicateStringsSortRepassOut(contents) {
        const [header1, header2, body] = contents.split(/\n\n/)
        const strings1 = header1.split("\n")
        const strings = this.replaceSymbolsOut(header2, strings1).split("\n")
        return this.replaceSymbolsOut(body, strings)
    }
    static deduplicateStringsSortRepassIn(contents) {
        const contentsShort = JSON.stringify(JSON.parse(contents))
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const seen = new Map()
        for (const m of contentsShort.matchAll(stringMatch)) {
            seen.set(m[1], (seen.get(m[1]) ?? 0) + 1)
        }

        const ordered = [...seen.entries()].sort(([ak, av], [bk, bv]) => +bv-av).map(([k]) => k)
        const orderedI = ordered.join("\n")

        const wordMatch = /([a-z0-9]+)/gi
        const seenW = new Map()
        for (const m of orderedI.matchAll(wordMatch)) {
            seenW.set(m[1], (seenW.get(m[1]) ?? 0) + 1)
        }

        const orderedW = [...seenW.entries()].sort(([ak, av], [bk, bv]) => +bv-av).map(([k]) => k)
        let out = orderedW.join("\n") + "\n\n"

        out += this.replaceSymbolsIn(orderedI, wordMatch, orderedW) + "\n\n"
        out += this.replaceSymbolsIn(contentsShort, stringMatch, ordered)

        return out
    }

    static referenceIn(contents) {
        return child_process.execSync("gzip -c", {input: contents}).toString("base64")
    }

    static referenceOut(contents) {
        return child_process.execSync("gzip -cd", {input: Buffer.from(contents, "base64"), encoding: "utf-8"})
    }
}

module.exports = Processors