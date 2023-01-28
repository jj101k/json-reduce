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
            const seenA: Array<SeenThing & {c: number, s: number}> = []
            const seen = new Map<string, number>()
            let i = 0

            const seenL = new Map<string, SeenInnerThing & {c: number}>()
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
                            s2 = {i: iL++, c: 0 }
                            seenL.set(m2[1], s2)
                        }
                        s2.c++
                        chunks2.push({pre: pre2, post: s2.i})
                    }
                    s = i++

                    seen.set(subString, s)
                    seenA.push({chunks: chunks2, lastMatchEnd: lastMatchEnd2, token: subString, c: 0, s})
                }

                seenA[s].c++

                chunks.push({ pre, post: s })
            }
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens (a) took ${b.valueOf() - a.valueOf()}ms`)
            }

            const subtokens = [...seenL.entries()].sort(([_, av], [__, bv]) => bv.c - av.c)

            const tokens = seenA.sort((a, b) => b.c - a.c)

            return {
                chunks,
                tokens,
                lastMatchEnd,
                subtokenBlock: subtokens.map(([k]) => k).join("\n"),
                subtokenOffsets: subtokens.map(([, {i}], offset) => [i, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset),
                tokenOffsets: tokens.map(({s}, offset) => [s, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset),
            }
        } finally {
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens took ${b.valueOf() - a.valueOf()}ms`)
            }
        }
    }
}