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
        describe(`${name} driver`, () => {
            it("can decode what it encodes in reasonable time", async function() {
                this.slow(2000)
                this.timeout(5000)
                const contents = ReferenceStats.getContents()

                const a = new Date()
                let encoded = ""
                for(const e of driver.encode(contents)) {
                    encoded += e
                }
                const b = new Date()
                let decoded = ""
                for(const d of driver.decode(encoded)) {
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
                assert(decodeTime < reference.decode * decodeThreshold, `Decode time ${decodeTime} is less than ${decodeThreshold}x ${reference.decode}`)

                assert(encoded.length < reference.ratio * contents.length * 3, `Encode ratio ${encoded.length * 100 / contents.length} is less than 3x ${reference.ratio}`)
            })
        })
    }
}