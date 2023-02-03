import * as fs from "fs"
import { createHash } from "node:crypto"
import { ReferencePureJS } from "./ReferencePureJS"

export class ReferenceStats {
    private static contents?: string
    static getContents() {
        if(!this.contents) {
            this.contents = fs.readFileSync("./example-large-file.json", {encoding: "utf-8"})
        }
        return this.contents
    }
    private static smallContents?: string
    static getSmallContents() {
        if(!this.smallContents) {
            this.smallContents = fs.readFileSync("./package.json", {encoding: "utf-8"})
        }
        return this.smallContents
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
    private static stats: {decode: number, encode: number, ratio: number} | undefined
    static getStats() {
        if(!this.stats) {
            this.stats = (() => {
                const contents = this.getContents()

                const sum = createHash("sha256").update(contents).digest("base64")
                const size = contents.length

                const before = new Date()
                let encoded = ""
                for(const block of ReferencePureJS.encode(contents)) {
                    encoded += block
                }
                const afterEncode = new Date()
                let decoded = ""
                for(const block of ReferencePureJS.decode(encoded)) {
                    decoded += block
                }
                const afterDecode = new Date()

                const sumi = createHash("sha256").update(decoded).digest("base64")

                if(sumi != sum) {
                    throw new Error(`Reference driver failed: ${sumi} != ${sum}`)
                }
                const sizei = encoded.length
                return {encode: afterEncode.valueOf()-before.valueOf(), decode: afterDecode.valueOf()-afterEncode.valueOf(), ratio: sizei / size}
            })()
        }
        return this.stats
    }
}