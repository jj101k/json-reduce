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
        const before = new Date()
        try {
            const infoByToken = new Map<string, {count: number, offset: number}>()
            let nextTokenInfoOffset = 0

            let chunks = []
            let lastMatchEnd = 0
            let match
            while (match = re.exec(contents)) {
                const pre: [number, number] = [lastMatchEnd, re.lastIndex - match[1].length]
                lastMatchEnd = re.lastIndex

                let tokenInfo = infoByToken.get(match[1])
                if (!tokenInfo) {
                    tokenInfo = { count: 0, offset: nextTokenInfoOffset++ }
                    infoByToken.set(match[1], tokenInfo)
                }
                tokenInfo.count++

                chunks.push({ pre, post: tokenInfo.offset })
            }

            return {
                chunks,
                tokens: [...infoByToken.entries()].sort(([ak, av], [bk, bv]) => +bv.count - av.count).map(([k, v]) => <[string, number]>[k, v.offset]),
                lastMatchEnd,
            }
        } finally {
            const after = new Date()
            if (this.debug) {
                console.warn(`Ordering tokens took ${after.valueOf() - before.valueOf()}ms`)
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