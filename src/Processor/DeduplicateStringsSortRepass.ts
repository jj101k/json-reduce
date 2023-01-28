import { Chunk } from "./Chunk"
import { MultiPass } from "./MultiPass"
import { PopularTokens } from "./PopularTokens"
import { SeenToken } from "./SeenToken"

/**
 *
 */
interface SeenPopularSubtoken {
    popularity: number
    token: string
}

/**
 *
 */
interface SeenPopularToken extends SeenToken {
    popularity: number
}

/**
 *
 */
export class DeduplicateStringsSortRepass extends MultiPass {
    /**
     *
     * @param ts
     */
    private popularSortWriteBack<T extends {popularity: number}>(ts: T[]) {
        const sorted = ts.slice().sort((av, bv) => bv.popularity - av.popularity)

        // Build abstract popularity
        let effectivePopularity = sorted.length
        for(const st of sorted) {
            st.popularity = --effectivePopularity
        }

        return sorted
    }

    popularTokens(contents: string, findTokens: RegExp, findSubtokens: RegExp): PopularTokens {
        const a = new Date()
        try {
            const tokensFound: Array<SeenPopularToken> = []
            const tokenFoundOffsets = new Map<string, number>()
            let currentToken = 0

            const subtokensFound: Array<SeenPopularSubtoken> = []
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
                    pre: {start: lastMatchEnd, finish: findTokens.lastIndex - token.length},
                    post: tokenFoundOffset
                })
                lastMatchEnd = findTokens.lastIndex
            }
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens (a) took ${b.valueOf() - a.valueOf()}ms`)
            }

            const subtokens = this.popularSortWriteBack(subtokensFound)

            const tokens = this.popularSortWriteBack(tokensFound)

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