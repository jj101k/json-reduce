import * as fs from "fs"
import { createHash } from "node:crypto"
import path from "path"
import { Decode, Encode } from ".."

const wd = path.dirname(process.argv[1])
const [filename] = process.argv.slice(2)

function canonicalise_json(contents: string) {
    return JSON.stringify(JSON.parse(contents))
}

const contents = fs.readFileSync(filename, {encoding: "utf-8"})

const sum = createHash("sha256").update(canonicalise_json(contents)).digest("base64")
const size = fs.statSync(filename).size
console.log(filename, sum, size)
const testers: Record<string, [Encode.Base, Decode.Base]> = {
    deduplicateStrings: [new Encode.SinglePass.Unsorted(), new Decode.SinglePass()],
    deduplicateStringsSort: [new Encode.SinglePass.Sorted(), new Decode.SinglePass()],
    deduplicateStringsRepass: [new Encode.MultiPass.Unsorted(), new Decode.MultiPass()],
    deduplicateStringsSortRepass: [new Encode.MultiPass.Sorted(), new Decode.MultiPass()],
}
for(const [name, [enc, dec]] of Object.entries(testers)) {
    const beforeAll = new Date()
    let encoded = ""
    for(const block of enc.encode(contents)) {
        encoded += block
    }
    const afterEncode = new Date()
    let decoded = ""
    for(const block of dec.decode(encoded)) {
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