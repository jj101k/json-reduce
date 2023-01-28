import { Chunk } from "./Chunk"

/**
 *
 */
export interface SeenToken {
    chunks: Chunk[]
    lastMatchEnd: number
    token: string
}
