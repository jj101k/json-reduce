import path from "path"
import * as fs from "fs"
import { DeduplicateStrings } from "../Processor/DeduplicateStrings"
import { DeduplicateStringsSort } from "../Processor/DeduplicateStringsSort"
import { DeduplicateStringsRepass } from "../Processor/DeduplicateStringsRepass"
import { DeduplicateStringsSortRepass } from "../Processor/DeduplicateStringsSortRepass"
import { createHash } from "node:crypto"

const wd = path.dirname(process.argv[1])
const [filename] = process.argv.slice(2)

function canonicalise_json(contents: string) {
    return JSON.stringify(JSON.parse(contents))
}

const contents = fs.readFileSync(filename, {encoding: "utf-8"})

const sum = createHash("sha256").update(canonicalise_json(contents)).digest("base64")
const size = fs.statSync(filename).size
console.log(filename, sum, size)
const testers = {
    deduplicateStrings: DeduplicateStrings,
    deduplicateStringsSort: DeduplicateStringsSort,
    deduplicateStringsRepass: DeduplicateStringsRepass,
    deduplicateStringsSortRepass: DeduplicateStringsSortRepass,
}
for(const [name, codec] of Object.entries(testers)) {
    const beforeAll = new Date()
    const handler = new codec()
    let encoded = ""
    for(const block of handler.encode(contents)) {
        encoded += block
    }
    const afterEncode = new Date()
    let decoded = ""
    for(const block of handler.decode(encoded)) {
        decoded += block
    }
    const afterDecode = new Date()

    const sumi = createHash("sha256").update(canonicalise_json(decoded)).digest("base64")

    if(sumi != sum) {
        console.error(`Fail: ${sumi} != ${sum}`)
    }
    const sizei = encoded.length
    console.log(`${name}: ${sizei} (${(sizei * 100 / size).toFixed(1)}%) ${afterEncode.valueOf()-beforeAll.valueOf()}ms/${afterDecode.valueOf()-afterEncode.valueOf()}ms`)
}