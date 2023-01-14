class Local {
    static debug = true

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

    static popularTokens(contents, re) {
        const seen = new Set()
        for (const m of contents.matchAll(re)) {
            if(!seen.has(m[1])) {
                seen.add(m[1])
            }
        }
        return [...seen]
    }

    /**
     *
     * @param {string} contents
     * @param {RegExp} re
     * @param {string[]} strings
     * @returns
     */
    static *replaceSymbolsIn(contents, re, strings) {
        // Ordering tokens took 269ms
        // Ordering tokens took 202ms
        // Replacing symbols took 429ms (8ms for map)
        // Replacing symbols took 516ms (25ms for map)
        //
        // Roughly 1/3 is map lookup time, 2/3 string build time
        const r = new Map([...strings].map((m, i) => [m, i]))
        const stringCode = (_, s) => r.get(s).toString(36)
        let m
        let lastMatchEnd = 0
        // console.warn(contents)
        while(m = re.exec(contents)) {
            // console.warn([lastMatchEnd, re.lastIndex, m[1], contents.substring(0, re.lastIndex)])
            const pre = contents.substring(lastMatchEnd, re.lastIndex - m[1].length)
            lastMatchEnd = re.lastIndex
            const post = stringCode("", m[1])
            yield pre + post
            // console.warn([pre, post])
        }
        yield contents.substring(lastMatchEnd, contents.length)

        // const cx = contents.split(re)
        // console.warn(`Matches: ${cx.length}`)
        // console.warn(cx.slice(0, 10).join(' -- '))

        // const bo = Buffer.alloc(Buffer.from(contents).length)
        // let boi = 0
        // let i
        // try {
        //     for(i = 0; i < cx.length - 1; i+=2) {
        //         bo.write(cx[i] + stringCode("", cx[i + 1])/*, boi*/)
        //         /*const chunk = Buffer.from(cx[i] + stringCode("", cx[i + 1]))
        //         boi += chunk.length*/
        //     }
        //     bo.write(cx[cx.length - 1]/*, boi*/)
        // } catch(e) {
        //     console.warn(e)
        //     console.warn(cx[i], cx[i+1])
        //     console.warn(`Looking for ${cx[i+1]}`)
        //     console.warn([...r].slice(0, 50))
        // }

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
    }

    static *replaceSymbolsOut(body, strings) {

        let m
        let lastMatchEnd = 0
        // console.warn(contents)
        const re = /([a-z0-9]+)/g
        while(m = re.exec(body)) {
            // console.warn([lastMatchEnd, re.lastIndex, m[1], contents.substring(0, re.lastIndex)])
            const pre = body.substring(lastMatchEnd, re.lastIndex - m[1].length)
            lastMatchEnd = re.lastIndex
            const post = strings[parseInt(m[1], 36)]
            yield pre + post
            // console.warn([pre, post])
        }
        yield body.substring(lastMatchEnd, body.length)


        // return body.replace(/([a-z0-9]+)/g, (_, $1) => strings[parseInt($1, 36)])
    }

    static shortenIfNeeded(contents) {
        if(contents.match(/^[\[{]\r?\n/s)) {
            return JSON.stringify(JSON.parse(contents))
        } else {
            return contents
        }
    }
}

module.exports = Local