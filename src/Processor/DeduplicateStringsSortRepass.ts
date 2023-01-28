import { Chunk } from "./Chunk"
import { MultiPass } from "./MultiPass"
import { PopularTokens } from "./PopularTokens"
import { PreBlock } from "./PreBlock"
import { SeenInnerThing } from "./SeenInnerThing"
import { SeenThing } from "./SeenThing"

/**
 *
 */
export class DeduplicateStringsSortRepass extends MultiPass {
    popularTokens(contents: string, re: RegExp, rex: RegExp): PopularTokens {
        const a = new Date()
        try {
            const seenA: Array<SeenThing & {popularity: number}> = []
            const seen = new Map<string, number>()
            let i = 0

            const seenL = new Map<string, SeenInnerThing & {popularity: number}>()
            let iL = 0

            const chunks: Chunk[] = []
            let lastMatchEnd = 0
            let m
            while (m = re.exec(contents)) {
                const pre: PreBlock = {start: lastMatchEnd, finish: re.lastIndex - m[1].length}
                lastMatchEnd = re.lastIndex

                const subString = m[1]

                let s = seen.get(subString)
                if (s === undefined) {
                    const chunks2: Chunk[] = []
                    let m2
                    let lastMatchEnd2 = 0
                    while(m2 = rex.exec(subString)) {
                        const pre2: PreBlock = {start: lastMatchEnd2, finish: rex.lastIndex - m2[1].length}
                        lastMatchEnd2 = rex.lastIndex

                        let s2 = seenL.get(m2[1])
                        if(!s2) {
                            s2 = {originalOffset: iL++, popularity: 0 }
                            seenL.set(m2[1], s2)
                        }
                        s2.popularity++
                        chunks2.push({pre: pre2, post: s2.originalOffset})
                    }
                    s = i++

                    seen.set(subString, s)
                    seenA.push({chunks: chunks2, lastMatchEnd: lastMatchEnd2, token: subString, popularity: 0})
                }

                seenA[s].popularity++

                chunks.push({ pre, post: s })
            }
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens (a) took ${b.valueOf() - a.valueOf()}ms`)
            }

            const subtokens = [...seenL.entries()].sort(([_, av], [__, bv]) => bv.popularity - av.popularity)

            const tokens = seenA.sort((a, b) => b.popularity - a.popularity)

            return {
                chunks,
                tokens,
                lastMatchEnd,
                subtokenBlock: subtokens.map(([k]) => k).join("\n"),
                subtokenOffsets: subtokens.map(([, {originalOffset: i}], offset) => [i, offset]).sort(([ai], [bi]) => bi - ai).map(([_, offset]) => offset),
                tokenOffsets: tokens.map(({popularity: c}, offset) => [c, offset]).sort(([ai], [bi]) => bi - ai).map(([_, offset]) => offset),
            }
        } finally {
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens took ${b.valueOf() - a.valueOf()}ms`)
            }
        }
    }
}