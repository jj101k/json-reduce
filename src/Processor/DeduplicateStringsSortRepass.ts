import { Chunk } from "./Chunk"
import { MultiPass } from "./MultiPass"
import { PopularTokens } from "./PopularTokens"
import { SeenThing } from "./SeenThing"

/**
 *
 */
export class DeduplicateStringsSortRepass extends MultiPass {
    popularTokens(contents: string, findTokens: RegExp, findSubtokens: RegExp): PopularTokens {
        const a = new Date()
        try {
            const tokensFound: Array<SeenThing & {popularity: number}> = []
            const tokenFoundOffsets = new Map<string, number>()
            let currentToken = 0

            const subtokensFound: Array<{popularity: number, token: string}> = []
            const subtokenFoundOffsets = new Map<string, number>()
            let currentSubtoken = 0

            const chunks: Chunk[] = []
            let lastMatchEnd = 0
            let tokenMatch: RegExpMatchArray | null
            while (tokenMatch = findTokens.exec(contents)) {
                const token = tokenMatch[1]

                let tokenFoundOffset = tokenFoundOffsets.get(token)
                if (tokenFoundOffset === undefined) {
                    const subtokenChunks: Chunk[] = []
                    let subtokenMatch: RegExpMatchArray | null
                    let subtokenLastMatchEnd = 0
                    while(subtokenMatch = findSubtokens.exec(token)) {
                        const subtoken = subtokenMatch[1]
                        let subtokenFoundOffset = subtokenFoundOffsets.get(subtoken)
                        if(subtokenFoundOffset === undefined) {
                            subtokenFoundOffset = currentSubtoken++
                            subtokenFoundOffsets.set(subtoken, subtokenFoundOffset)
                            subtokensFound.push({popularity: 0, token: subtoken})
                        }
                        subtokensFound[subtokenFoundOffset].popularity++
                        subtokenChunks.push({
                            pre: {start: subtokenLastMatchEnd, finish: findSubtokens.lastIndex - subtoken.length},
                            post: subtokenFoundOffset,
                        })

                        subtokenLastMatchEnd = findSubtokens.lastIndex
                    }
                    tokenFoundOffset = currentToken++

                    tokenFoundOffsets.set(token, tokenFoundOffset)
                    tokensFound.push({chunks: subtokenChunks, lastMatchEnd: subtokenLastMatchEnd, token: token, popularity: 0})
                }

                tokensFound[tokenFoundOffset].popularity++

                chunks.push({
                    pre: {start: lastMatchEnd, finish: findTokens.lastIndex - tokenMatch[1].length},
                    post: tokenFoundOffset
                })
                lastMatchEnd = findTokens.lastIndex
            }
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens (a) took ${b.valueOf() - a.valueOf()}ms`)
            }

            const subtokens = subtokensFound.slice().sort((av, bv) => bv.popularity - av.popularity)

            // Build abstract popularity
            let ix = subtokens.length
            for(const st of subtokens) {
                st.popularity = --ix
            }

            const tokens = tokensFound.slice().sort((a, b) => b.popularity - a.popularity)

            // Build abstract popularity
            ix = tokens.length
            for(const t of tokens) {
                t.popularity = --ix
            }

            return {
                chunks,
                tokens,
                lastMatchEnd,
                subtokenBlock: subtokens.map(v => v.token).join("\n"),
                subtokenOffsets: subtokensFound.map(({popularity}) => subtokensFound.length - popularity - 1),
                tokenOffsets: tokensFound.map(({popularity}) => tokensFound.length - popularity - 1),
            }
        } finally {
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens took ${b.valueOf() - a.valueOf()}ms`)
            }
        }
    }
}