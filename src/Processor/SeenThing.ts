import { Chunk } from "./Chunk"

/**
 *
 */
export interface SeenThing {
    chunks: Chunk[]
    lastMatchEnd: number
    t: string
}
