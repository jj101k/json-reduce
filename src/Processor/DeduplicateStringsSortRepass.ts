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
    /**
     *
     * @param contents
     * @param re
     * @param rex
     * @returns
     */
    orderedPopularTokens(contents: string, re: RegExp, rex: RegExp): PopularTokens {
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
                const pre: PreBlock = [lastMatchEnd, re.lastIndex - m[1].length]
                lastMatchEnd = re.lastIndex

                const subString = m[1]

                let s = seen.get(subString)
                if (s === undefined) {
                    const chunks2: Chunk[] = []
                    let m2
                    let lastMatchEnd2 = 0
                    while(m2 = rex.exec(subString)) {
                        const pre2: PreBlock = [lastMatchEnd2, rex.lastIndex - m2[1].length]
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
                    seenA.push({chunks: chunks2, lastMatchEnd: lastMatchEnd2, t: subString, c: 0, s})
                }

                seenA[s].c++

                chunks.push({ pre, post: s })
            }
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens (a) took ${b.valueOf() - a.valueOf()}ms`)
            }

            return {
                chunks,
                tokens: seenA.sort((a, b) => b.c - a.c).map(v => [v.t, v.s, v.chunks, v.lastMatchEnd]),
                tokens2: [...seenL.entries()].sort(([ak, av], [bk, bv]) => bv.c - av.c).map(([k, v]) => [k, v.i]),
                lastMatchEnd,
            }
        } finally {
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens took ${b.valueOf() - a.valueOf()}ms`)
            }
        }
    }

    *encodeInner(contents: string) {
        const contentsShort = this.shortenIfNeeded(contents)
        const stringMatch = /("[^"\\]*(?:\\.[^"\\]*)*"|[a-z0-9]+)/g
        const ordered = this.orderedPopularTokens(contentsShort, stringMatch, /([a-z0-9]+)/gi)

        yield ordered.tokens2.map(([k]) => k).join("\n") + "\n\n"

        const tokenRefOffsets = ordered.tokens2.map(([_, i], offset) => [i, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset)

        for(const [replace, i, chunks, lastMatchEnd] of ordered.tokens) {
            let buffer = ""
            for(const c of chunks) {
                const pre = replace.substring(c.pre[0], c.pre[1])
                const post = tokenRefOffsets[c.post].toString(36)
                buffer += pre + post
            }
            yield buffer + replace.substring(lastMatchEnd, contentsShort.length) + "\n"
        }
        yield "\n\n"

        const tokenRefOffsets2 = ordered.tokens.map(([_, i], offset) => [i, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset)

        let buffer = ""
        for (const t of ordered.chunks) {
            const pre = contentsShort.substring(t.pre[0], t.pre[1])
            const post = tokenRefOffsets2[t.post].toString(36)
            buffer += pre + post
            if(buffer.length > 65536) {
                yield buffer
                buffer = ""
            }
        }
        if(buffer.length > 0) {
            yield buffer
        }
        return contentsShort.substring(ordered.lastMatchEnd)
    }
}