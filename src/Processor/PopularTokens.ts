import { Chunk } from "./Chunk"
import { SeenThing } from "./SeenThing"

/**
 *
 */
export interface PopularTokens {
    chunks: Chunk[]
    tokens: Array<SeenThing>
    lastMatchEnd: number
    subtokenBlock: string
    subtokenOffsets: number[]
    tokenOffsets: number[]
}