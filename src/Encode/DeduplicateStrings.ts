import { Chunk } from "./Chunk"
import { PreBlock } from "./PreBlock"
import { SinglePass } from "./SinglePass"

/**
 *
 */
export class DeduplicateStrings extends SinglePass {
    /**
     *
     * @param contents
     * @param re
     * @returns
     */
    popularTokens(contents: string, re: RegExp) {
        const before = new Date()
        try {
            const tokenOffsets = new Map<string, {offset: number}>()
            let nextSeenEntry = 0

            let chunks: Chunk[] = []
            let lastMatchEnd = 0
            let match: RegExpMatchArray | null
            while (match = re.exec(contents)) {
                const pre: PreBlock = {start: lastMatchEnd, finish: re.lastIndex - match[1].length}
                lastMatchEnd = re.lastIndex

                let tokenOffset = tokenOffsets.get(match[1])
                if (!tokenOffset) {
                    tokenOffset = { offset: nextSeenEntry++ }
                    tokenOffsets.set(match[1], tokenOffset)
                }

                chunks.push({ pre, post: tokenOffset.offset })
            }

            return {
                chunks,
                tokens: [...tokenOffsets.entries()].map(([k, v]) => <[string, number]>[k, v.offset]),
                lastMatchEnd,
            }
        } finally {
            const after = new Date()
            if (this.debug) {
                console.warn(`Finding tokens took ${after.valueOf() - before.valueOf()}ms`)
            }
        }
    }

    *encodeInner(contents: string) {
        const contentsShort = this.shortenIfNeeded(contents)
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const seen = this.popularTokens(contentsShort, stringMatch)
        yield seen.tokens.map(([k]) => k).join("\n") + "\n\n"
        return yield *this.replaceSymbolsIn(contentsShort, seen)
    }
}