import { Chunk } from "./Chunk"
import { MultiPass } from "./MultiPass"
import { PopularTokens } from "./PopularTokens"
import { PreBlock } from "./PreBlock"
import { SeenInnerThing } from "./SeenInnerThing"
import { SeenThing } from "./SeenThing"

/**
 *
 */
export class DeduplicateStringsRepass extends MultiPass {
    /**
     *
     * @param contents
     * @param re
     * @param rex
     * @returns
     */
    popularTokens(contents: string, re: RegExp, rex: RegExp): PopularTokens {
        const a = new Date()
        try {
            const seenA: Array<SeenThing> = []
            const seen = new Map<string, number>()
            let i = 0

            const seenL = new Map<string, SeenInnerThing>()
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
                            s2 = {i: iL++ }
                            seenL.set(m2[1], s2)
                        }
                        chunks2.push({pre: pre2, post: s2.i})
                    }
                    s = i++

                    seen.set(subString, s)
                    seenA.push({chunks: chunks2, lastMatchEnd: lastMatchEnd2, token: subString})
                }

                chunks.push({ pre, post: s })
            }
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens (a) took ${b.valueOf() - a.valueOf()}ms`)
            }

            return {
                chunks,
                tokens: seenA.map((v, i) => ({i, ...v})),
                subtokens: [...seenL.entries()].map(([k, v]) => ({token: k, originalReference: v.i})),
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
        const ordered = this.popularTokens(contentsShort, stringMatch, /([a-z0-9]+)/gi)

        yield ordered.subtokens.map(({token}) => token).join("\n") + "\n\n"

        const tokenRefOffsets = ordered.subtokens.map(({originalReference}, offset) => [originalReference, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset)

        for(const t of ordered.tokens) {
            let buffer = ""
            for(const c of t.chunks) {
                const pre = t.token.substring(c.pre.start, c.pre.finish)
                const post = tokenRefOffsets[c.post].toString(36)
                buffer += pre + post
            }
            yield buffer + t.token.substring(t.lastMatchEnd, contentsShort.length) + "\n"
        }
        yield "\n\n"

        const tokenRefOffsets2 = ordered.tokens.map(({i}, offset) => [i, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset)

        let buffer = ""
        for (const t of ordered.chunks) {
            const pre = contentsShort.substring(t.pre.start, t.pre.finish)
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