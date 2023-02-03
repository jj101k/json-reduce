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
    static testDriver(name: string, driver: {decode(s: string): Iterable<string>, encode(s: string): Iterable<string>}) {
        const decodeThreshold = 7
        let decodedCached: string | null = null
        let encodedCached: string | null = null
        describe(`${name} driver`, () => {
            it("can encode and decode (trivial scale)", function() {
                const contents = `{"a-c":1,"b-c":1, "d": {"a:b/c":true}}`

                let encoded = ""
                for(const block of driver.encode(contents)) {
                    encoded += block
                }
                let decoded = ""
                for(const block of driver.decode(encoded)) {
                    decoded += block
                }
                const sumi = ReferenceStats.getCanonicalSumFor(decoded)
                const sum = ReferenceStats.getCanonicalSumFor(contents)

                assert(sumi == sum, `End file ${sumi} == ${sum}`)
            })
            it("can encode and decode (small scale)", function() {
                const contents = ReferenceStats.getSmallContents()

                let encoded = ""
                for(const block of driver.encode(contents)) {
                    encoded += block
                }
                let decoded = ""
                for(const block of driver.decode(encoded)) {
                    decoded += block
                }
                const sumi = ReferenceStats.getCanonicalSumFor(decoded)
                const sum = ReferenceStats.getCanonicalSumFor(contents)

                assert(sumi == sum, `End file ${sumi} == ${sum}`)
            })
            const reference = ReferenceStats.getStats()
            it("can encode", function() {
                this.slow(reference.encode * 2)
                this.timeout(reference.encode * 4)

                const contents = ReferenceStats.getContents()

                const before = new Date()

                let encoded = ""
                for(const block of driver.encode(contents)) {
                    encoded += block
                }
                encodedCached = encoded

                const after = new Date()

                console.log(`Encode time for ${name} is ${(after.valueOf() - before.valueOf())}ms, versus ${reference.encode}ms`)
            })
            it("encodes to a reasonable size", () => {
                const contents = ReferenceStats.getContents()
                const encodeRatio = Math.round((encodedCached!.length * 100 / contents.length) * 10) / 10
                console.log(`Encode ratio for ${name} is ${encodeRatio}%`)
                assert(encodeRatio < reference.ratio * 100 * 3, `Encode ratio ${encodeRatio}% is less than 3x ${reference.ratio * 100}%`)
            })
            it("can decode what it encodes in reasonable time", function() {
                this.slow(reference.decode * decodeThreshold / 2)
                this.timeout(reference.decode * decodeThreshold)

                let decoded = ""
                for(const block of driver.decode(encodedCached!)) {
                    decoded += block
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