import assert from "node:assert"
import { ReferenceStats } from "./ReferenceStats"

/**
 *
 */
export class TestHandler {
    /**
     *
     * @param name
     * @param driver
     */
    static testDriver(name: string, driver: {decode(s: string): Generator<string> | string[], encode(s: string): Generator<string> | string[]}) {
        const decodeThreshold = 7
        let decodedCached: string | null = null
        let encodedCached: string | null = null
        describe(`${name} driver`, () => {
            const reference = ReferenceStats.getStats()
            it("can encode", function() {
                this.slow(reference.encode * 2)
                this.timeout(reference.encode * 4)

                const contents = ReferenceStats.getContents()

                let encoded = ""
                for(const e of driver.encode(contents)) {
                    encoded += e
                }
                encodedCached = encoded
            })
            it("encodes to a reasonable size", () => {
                const contents = ReferenceStats.getContents()
                assert(encodedCached!.length < reference.ratio * contents.length * 3, `Encode ratio ${encodedCached!.length * 100 / contents.length} is less than 3x ${reference.ratio}`)
            })
            it("can decode what it encodes in reasonable time", function() {
                this.slow(reference.decode * decodeThreshold / 2)
                this.timeout(reference.decode * decodeThreshold)

                let decoded = ""
                for(const d of driver.decode(encodedCached!)) {
                    decoded += d
                }
                decodedCached = decoded
            })
            it("decodes to a compatible form", () => {
                const sumi = ReferenceStats.getCanonicalSumFor(decodedCached!)
                const sum = ReferenceStats.getCanonicalSum()

                assert(sumi == sum, `End file ${sumi} == ${sum}`)
            })
        })
    }
}