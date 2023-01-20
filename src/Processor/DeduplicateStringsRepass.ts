import { MultiPass } from "./MultiPass"

export class DeduplicateStringsRepass extends MultiPass {
    static popularTokens(contents: string, re: RegExp, rex: RegExp) {
        const a = new Date()
        try {
            const seen = new Map<string, {i: number, chunks: any, lastMatchEnd: number}>()
            let i = 0

            const seenL = new Map<string, {i: number}>()
            let iL = 0

            let chunks = []
            let lastMatchEnd = 0
            let m
            while (m = re.exec(contents)) {
                const pre: [number, number] = [lastMatchEnd, re.lastIndex - m[1].length]
                lastMatchEnd = re.lastIndex

                const subString = m[1]

                let s = seen.get(subString)
                if (!s) {
                    let chunks2 = []
                    let m2
                    let lastMatchEnd2 = 0
                    while(m2 = rex.exec(subString)) {
                        const pre2: [number, number] = [lastMatchEnd2, rex.lastIndex - m2[1].length]
                        lastMatchEnd2 = rex.lastIndex

                        let s2 = seenL.get(m2[1])
                        if(!s2) {
                            s2 = {i: iL++ }
                            seenL.set(m2[1], s2)
                        }
                        chunks2.push({pre: pre2, post: s2.i})
                    }

                    s = { i: i++, chunks: chunks2, lastMatchEnd: lastMatchEnd2 }
                    seen.set(subString, s)
                }

                chunks.push({ pre, post: s.i })
            }

            return {
                chunks,
                tokens: [...seen.entries()].map(([k, v]) => <[string, number, any, number]>[k, v.i, v.chunks, v.lastMatchEnd]),
                tokens2: [...seenL.entries()].map(([k, v]) => <[string, number]>[k, v.i]),
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
        const ordered = this.popularTokens(contentsShort, stringMatch, /([a-z0-9]+)/gi)

        yield ordered.tokens2.map(([k]) => k).join("\n") + "\n\n"

        const tokenRefOffsets = ordered.tokens2.map(([_, i], offset) => [i, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset)

        for(const [replace, i, chunks, lastMatchEnd] of ordered.tokens) {
            let buffer = ""
            for(const c of chunks) {
                const pre = replace.substring(c.pre[0], c.pre[1])
                const post = tokenRefOffsets[c.post].toString(36)
                buffer += pre + post
            }
            yield buffer + replace.substring(lastMatchEnd, contents.length) + "\n"
        }
        yield "\n\n"

        const tokenRefOffsets2 = ordered.tokens.map(([_, i], offset) => [i, offset]).sort(([ai], [bi]) => ai - bi).map(([_, offset]) => offset)

        let buffer = ""
        for (const t of ordered.chunks) {
            const pre = contents.substring(t.pre[0], t.pre[1])
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
        yield contents.substring(ordered.lastMatchEnd, contents.length)
    }
}