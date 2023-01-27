import { Chunk } from "./Chunk"

/**
 *
 */
export interface PopularTokens {
    chunks: Chunk[]
    tokens: Array<[string, number, Chunk[], number]>
    tokens2: Array<[string, number]>
    lastMatchEnd: number
}