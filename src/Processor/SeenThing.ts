import { Chunk } from "./Chunk"

/**
 *
 */
export interface SeenThing {
    chunks: Chunk[]
    lastMatchEnd: number
    token: string
}
