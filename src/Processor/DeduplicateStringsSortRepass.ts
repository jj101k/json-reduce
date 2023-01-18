import { MultiPass } from "./MultiPass"

export class DeduplicateStringsSortRepass extends MultiPass {
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