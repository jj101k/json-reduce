import { SinglePass } from "./SinglePass"

export class DeduplicateStrings extends SinglePass {
    static popularTokens(contents: string, re: RegExp) {
        const a = new Date()
        try {
            const seen = new Map<string, {i: number}>()
            let i = 0

            let chunks = []
            let lastMatchEnd = 0
            let m
            while (m = re.exec(contents)) {
                const pre: [number, number] = [lastMatchEnd, re.lastIndex - m[1].length]
                lastMatchEnd = re.lastIndex

                let s = seen.get(m[1])
                if (!s) {
                    s = { i: i++ }
                    seen.set(m[1], s)
                }

                chunks.push({ pre, post: s.i })
            }

            return {
                chunks,
                tokens: [...seen.entries()].map(([k, v]) => <[string, number]>[k, v.i]),
                lastMatchEnd,
            }
        } finally {
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens took ${b.valueOf() - a.valueOf()}ms`)
            }
        }
    }

    static *encode(contents: string) {
        const contentsShort = this.shortenIfNeeded(contents)
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const seen = this.popularTokens(contentsShort, stringMatch)
        yield seen.tokens.map(([k]) => k).join("\n") + "\n\n"
        yield *this.replaceSymbolsIn(contentsShort, seen)
    }
}