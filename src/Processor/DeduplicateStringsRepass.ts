import { Chunk } from "./Chunk"
import { MultiPass } from "./MultiPass"
import { PopularTokens } from "./PopularTokens"
import { SeenToken } from "./SeenToken"

/**
 *
 */
export class DeduplicateStringsRepass extends MultiPass {
    popularTokens(contents: string, findTokens: RegExp, findSubtokens: RegExp): PopularTokens {
        const a = new Date()
        try {
            const tokensFound: Array<SeenToken> = []
            const tokenFoundOffsets = new Map<string, number>()
            let currentToken = 0

            const subtokensFound = new Map<string, number>()
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
                        let subtokenFound = subtokensFound.get(subtoken)
                        if(subtokenFound === undefined) {
                            subtokenFound = currentSubtoken++
                            subtokensFound.set(subtoken, subtokenFound)
                        }
                        subtokenChunks.push({
                            pre: {start: subtokenLastMatchEnd, finish: findSubtokens.lastIndex - subtoken.length},
                            post: subtokenFound,
                        })
                        subtokenLastMatchEnd = findSubtokens.lastIndex
                    }
                    tokenFoundOffset = currentToken++

                    tokenFoundOffsets.set(token, tokenFoundOffset)
                    tokensFound.push({chunks: subtokenChunks, lastMatchEnd: subtokenLastMatchEnd, token: token})
                }

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

            const subtokens = [...subtokensFound.entries()]

            return {
                chunks,
                tokens: tokensFound,
                lastMatchEnd,
                subtokenBlock: subtokens.map(([k]) => k).join("\n"),
                subtokenOffsets: subtokens.map((_, offset) => offset),
                tokenOffsets: tokensFound.map((_, offset) => offset),
            }
        } finally {
            const b = new Date()
            if (this.debug) {
                console.warn(`Finding tokens took ${b.valueOf() - a.valueOf()}ms`)
            }
        }
    }
}