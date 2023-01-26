import { SinglePass } from "./SinglePass"

/**
 *
 */
export class DeduplicateStringsSort extends SinglePass {
    /**
     *
     * @param contents
     * @param re
     * @returns
     */
    orderedPopularTokens(contents: string, re: RegExp) {
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

    /**
     *
     * @param contents
     */
    *encodeInner(contents: string) {
        const contentsShort = this.shortenIfNeeded(contents)
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const ordered = this.orderedPopularTokens(contentsShort, stringMatch)
        yield ordered.tokens.map(([k]) => k).join("\n") + "\n\n"
        return yield *this.replaceSymbolsIn(contentsShort, ordered)
    }
}