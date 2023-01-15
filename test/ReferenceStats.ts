import { Reference } from "../src/Processor/Reference"
import * as fs from "fs"
import { createHash } from "node:crypto"

export class ReferenceStats {
    private static contents?: string
    static getContents() {
        if(!this.contents) {
            this.contents = fs.readFileSync("./example-large-file.json", {encoding: "utf-8"})
        }
        return this.contents
    }
    static getCanonicalSumFor(contents: string) {
        const canonicalContents = JSON.stringify(JSON.parse(contents))
        return createHash("sha256").update(canonicalContents).digest("base64")
    }
    private static canonicalSum?: string
    static getCanonicalSum() {
        if(!this.canonicalSum) {
            this.canonicalSum = this.getCanonicalSumFor(this.getContents())
        }
        return this.canonicalSum
    }

    static getSize() {
        return this.getContents().length
    }
    private static stats: Promise<{decode: number, encode: number, ratio: number}>
    static async getStats() {
        if(!this.stats) {
            this.stats = (async () => {
                const contents = this.getContents()

                const sum = createHash("sha256").update(contents).digest("base64")
                const size = contents.length

                const a = new Date()
                let encoded = ""
                for(const e of Reference.encode(contents)) {
                    encoded += e
                }
                const b = new Date()
                let decoded = ""
                for(const d of Reference.decode(encoded)) {
                    decoded += d
                }
                const c = new Date()

                const sumi = createHash("sha256").update(decoded).digest("base64")

                if(sumi != sum) {
                    throw new Error(`Reference driver failed: ${sumi} != ${sum}`)
                }
                const sizei = encoded.length
                return {encode: b.valueOf()-a.valueOf(), decode: c.valueOf()-b.valueOf(), ratio: sizei / size}
            })()
        }
        return this.stats
    }
}