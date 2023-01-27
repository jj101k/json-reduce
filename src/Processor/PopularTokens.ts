import { Chunk } from "./Chunk"

/**
 *
 */
export interface PopularTokens {
    chunks: Chunk[]
    tokens: Array<[string, number, Chunk[], number]>
    subtokens: Array<{token: string, originalReference: number}>
    lastMatchEnd: number
}