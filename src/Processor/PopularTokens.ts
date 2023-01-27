import { Chunk } from "./Chunk"
import { SeenThing } from "./SeenThing"

/**
 *
 */
export interface PopularTokens {
    chunks: Chunk[]
    tokens: Array<SeenThing & {i: number}>
    subtokens: Array<{token: string, originalReference: number}>
    lastMatchEnd: number
}