import { Chunk } from "./Chunk"
import { MultiPass } from "./MultiPass"
import { PopularTokens } from "./PopularTokens"
import { SeenToken } from "./SeenToken"

/**
 *
 */
export class DeduplicateStringsRepass extends MultiPass {
    popularTokens(contents: string, findTokens: RegExp, findSubtokens: RegExp): PopularTokens {
        const before = new Date()
        try {
            const tokensFound: Array<SeenToken> = []
            const tokenFoundOffsets = new Map<string, number>()
            let currentToken = 0

            const subtokensFound = new Map<string, number>()
            let currentSubtoken = 0

            const chunks: Chunk[] = []
            let lastMatchEnd = 0
            let tokenMatch: RegExpMatchArray | null

            while(tokenMatch = contents.substring(lastMatchEnd).match(findTokens)) {
                const preamble = tokenMatch[1]
                const token = tokenMatch[2]

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
                    pre: {start: lastMatchEnd, finish: lastMatchEnd + preamble.length},
                    post: tokenFoundOffset
                })

                lastMatchEnd += preamble.length + token.length
            }
            const afterFindTokens = new Date()
            if (this.debug) {
                console.warn(`Finding tokens (a) took ${afterFindTokens.valueOf() - before.valueOf()}ms`)
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
            const afterMap = new Date()
            if (this.debug) {
                console.warn(`Finding tokens took ${afterMap.valueOf() - before.valueOf()}ms`)
            }
        }
    }
}