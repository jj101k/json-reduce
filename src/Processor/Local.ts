export class Local {
    static debug = true

    static orderedPopularTokens(contents: string, re: RegExp) {
        const a = new Date()
        try {
            const seen = new Map<string, {c: number, i: number}>()
            let i = 0

            let chunks = []
            let lastMatchEnd = 0
            let m
            while (m = re.exec(contents)) {
                const pre: [number, number] = [lastMatchEnd, re.lastIndex - m[1].length]
                lastMatchEnd = re.lastIndex

                let s = seen.get(m[1])
                if (!s) {
                    s = { c: 0, i: i++ }
                    seen.set(m[1], s)
                }
                s.c++

                chunks.push({ pre, post: s.i })
            }

            return {
                chunks,
                tokens: [...seen.entries()].sort(([ak, av], [bk, bv]) => +bv.c - av.c).map(([k, v]) => <[string, number]>[k, v.i]),
                lastMatchEnd,
            }
        } finally {
            const b = new Date()
            if (this.debug) {
                console.warn(`Ordering tokens took ${b.valueOf() - a.valueOf()}ms`)
            }
        }
    }

    static popularTokens(contents: string, re: RegExp) {
        const seen = new Set<string>()
        for (const m of contents.matchAll(re)) {
            if (!seen.has(m[1])) {
                seen.add(m[1])
            }
        }
        return [...seen]
    }

    /**
     *
     * @param contents
     * @param re
     * @param tokens
     * @returns
     */
    static *replaceSymbolsInX(contents: string, re: RegExp, tokens: { chunks: { pre: [number, number], post: number }[], tokens: [string, number][], lastMatchEnd: number }) {
        const tokenRefOffsets = tokens.tokens.map(([_, i], offset) => [i, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset)

        for (const t of tokens.chunks) {
            const pre = contents.substring(t.pre[0], t.pre[1])
            const post = tokenRefOffsets[t.post].toString(36)
            yield pre + post
        }
        yield contents.substring(tokens.lastMatchEnd, contents.length)
    }

    /**
     *
     * @param contents
     * @param re
     * @param strings
     * @returns
     */
    static *replaceSymbolsIn(contents: string, re: RegExp, strings: string[]) {
        // Ordering tokens took 269ms
        // Ordering tokens took 202ms
        // Replacing symbols took 429ms (8ms for map)
        // Replacing symbols took 516ms (25ms for map)
        //
        // Roughly 1/3 is map lookup time, 2/3 string build time
        const r = new Map([...strings].map((m, i) => [m, i]))
        const stringCode = (_: any, s: string) => r.get(s)!.toString(36)
        let m
        let lastMatchEnd = 0
        while (m = re.exec(contents)) {
            const pre = contents.substring(lastMatchEnd, re.lastIndex - m[1].length)
            lastMatchEnd = re.lastIndex
            const post = stringCode("", m[1])
            yield pre + post
        }
        yield contents.substring(lastMatchEnd, contents.length)
    }

    static *replaceSymbolsOut(body: string, strings: string[]) {

        let m
        let lastMatchEnd = 0
        const re = /([a-z0-9]+)/g
        while (m = re.exec(body)) {
            const pre = body.substring(lastMatchEnd, re.lastIndex - m[1].length)
            lastMatchEnd = re.lastIndex
            const post = strings[parseInt(m[1], 36)]
            yield pre + post
        }
        yield body.substring(lastMatchEnd, body.length)
    }

    static shortenIfNeeded(contents: string) {
        if (contents.match(/^[\[{]\r?\n/s)) {
            return JSON.stringify(JSON.parse(contents))
        } else {
            return contents
        }
    }
}