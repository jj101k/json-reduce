import { Chunk } from "../Chunk"
import { SeenToken } from "./SeenToken"

/**
 *
 */
export interface PopularTokens {
    chunks: Chunk[]
    tokens: Array<SeenToken>
    lastMatchEnd: number
    subtokenBlock: string
    subtokenOffsets: number[]
    tokenOffsets: number[]
}