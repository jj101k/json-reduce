const child_process = require("child_process")

class Processors {
    static debug = true
    static shortenIfNeeded(contents) {
        if(contents.match(/^[\[{]\r?\n/s)) {
            return JSON.stringify(JSON.parse(contents))
        } else {
            return contents
        }
    }
    static replaceSymbolsIn(contents, re, strings) {
        // Ordering tokens took 269ms
        // Ordering tokens took 202ms
        // Replacing symbols took 429ms (8ms for map)
        // Replacing symbols took 516ms (25ms for map)
        //
        // Roughly 1/3 is map lookup time, 2/3 string build time
        const a = new Date()
        const rs = []
        for(let i = 1; i/10 < strings.length; i*=10) {
            const ip = Math.floor(i/10)
            const s = strings.slice(ip, i)
            const r = new Map([...s].map((m, j) => [m, ip + j]))
            rs.push(r)
        }
        const stringCode2 = (_, s) => {
            for(const r of rs) {
                const rx = r.get(s)
                if(rx !== undefined) {
                    return rx.toString(36)
                }
            }
            for(const i in strings) {
                if(strings[i] == s) {
                    console.warn(`Found at ${i}`)
                }
            }
            throw new Error(`Internal error: symbol not found: ${s}`)
        }
        const stringCode3 = () => ""
        const r = new Map([...strings].map((m, i) => [m, i]))
        const stringCode = (_, s) => r.get(s).toString(36)
        const c = new Date()
        try {
            return contents.replace(re, stringCode)
        } finally {
            const b = new Date()
            if(this.debug) {
                console.warn(`Replacing symbols took ${b-a}ms (${c-a}ms for map) with ${strings.length} unique strings`)
            }
            const cx = contents.split(re)
            console.warn(`Matches: ${cx.length}`)
            // console.warn(cx.slice(0, 10).join(' -- '))
            const bo = Buffer.alloc(Buffer.from(contents).length)
            let boi = 0
            let i
            try {
                for(i = 0; i < cx.length - 1; i+=2) {
                    bo.write(cx[i] + stringCode("", cx[i + 1])/*, boi*/)
                    /*const chunk = Buffer.from(cx[i] + stringCode("", cx[i + 1]))
                    boi += chunk.length*/
                }
                bo.write(cx[cx.length - 1]/*, boi*/)
            } catch(e) {
                console.warn(e)
                console.warn(cx[i], cx[i+1])
                console.warn(`Looking for ${cx[i+1]}`)
                console.warn([...r].slice(0, 50))
            }
            // let o = ""
            // let i
            // try {
            //     for(i = 0; i < cx.length - 1; i+=2) {
            //         o += cx[i] + stringCode("", cx[i + 1])
            //     }
            //     o += cx[cx.length - 1]
            // } catch(e) {
            //     console.warn(cx[i], cx[i+1])
            //     console.warn(`Looking for ${cx[i+1]}`)
            //     console.warn([...r].slice(0, 50))
            // }
            const d = new Date()
            console.warn(d-b)
        }
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
        const contentsShort = this.shortenIfNeeded(contents)
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
        const contentsShort = this.shortenIfNeeded(contents)
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
        const a = new Date()
        try {
            const seen = new Map()
            for (const m of contents.matchAll(re)) {
                seen.set(m[1], (seen.get(m[1]) ?? 0) + 1)
            }

            return [...seen.entries()].sort(([ak, av], [bk, bv]) => +bv-av).map(([k]) => k)
        } finally {
            const b = new Date()
            if(this.debug) {
                console.warn(`Ordering tokens took ${b-a}ms`)
            }
        }
    }
    static deduplicateStringsSortRepassIn(contents) {
        const contentsShort = this.shortenIfNeeded(contents)
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
        const contentsShort = this.shortenIfNeeded(contents)
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