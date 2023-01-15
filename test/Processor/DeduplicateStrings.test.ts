import assert from "node:assert"
import { DeduplicateStrings } from "../../src/Processor/DeduplicateStrings"
import { ReferenceStats } from "../ReferenceStats"

describe("Plain deduplicate strings driver", () => {
    it("can decode what it encodes in reasonable time", async function() {
        this.slow(2000)
        const contents = ReferenceStats.getContents()
        const size = contents.length

        const a = new Date()
        let encoded = ""
        for(const e of DeduplicateStrings.encode(contents)) {
            encoded += e
        }
        const b = new Date()
        let decoded = ""
        for(const d of DeduplicateStrings.decode(encoded)) {
            decoded += d
        }
        const c = new Date()

        const encodeTime = b.valueOf() - a.valueOf()
        const decodeTime = c.valueOf() - b.valueOf()

        const sumi = ReferenceStats.getCanonicalSumFor(decoded)
        const sum = ReferenceStats.getCanonicalSum()

        assert(sumi == sum, `End file ${sumi} == ${sum}`)

        const reference = await ReferenceStats.getStats()
        assert(encodeTime < reference.encode * 4, `Encode time ${encodeTime} is less than 4x ${reference.encode}`)
        assert(decodeTime < reference.decode * 3, `Decode time ${decodeTime} is less than 3x ${reference.decode}`)
    })
})