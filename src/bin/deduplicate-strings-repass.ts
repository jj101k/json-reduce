import getopts from "getopts"
import * as fs from "fs"
import * as fsPromises from "node:fs/promises"
import { DeduplicateStringsRepass } from "../Processor/DeduplicateStringsRepass"

const opts = getopts(process.argv, {
    boolean: ["d", "s"]
})

const [filename] = opts._.slice(2)

const handler = new DeduplicateStringsRepass()
let handlerChunks: Generator<string>
if(opts.d) {
    const contents = fs.readFileSync(filename, {encoding: "utf-8"})
    handlerChunks = handler.decode(contents)
    for(const chunk of handlerChunks) {
        process.stdout.write(chunk)
    }
} else if(opts.s) {
    const contents = fs.readFileSync(filename, {encoding: "utf-8"})
    handlerChunks = handler.encode(contents)
    let l = 0
    for(const chunk of handlerChunks) {
        l += chunk.length
        process.stdout.write(chunk)
    }
    console.warn(`${l} bytes`)
} else {
    (async () => {
        const fd = await fsPromises.open(filename)
        const buffer = Buffer.alloc(65536)
        let l = 0, i = 0
        let contents
        while((contents = await fd.read({buffer})).bytesRead > 0) {
            if(i > 0) {
                process.stdout.write("\n\n")
            }
            i++
            const s = contents.buffer.toString("utf-8", 0, contents.bytesRead)
            handlerChunks = handler.encodeBlock(s, filename)
            for(const chunk of handlerChunks) {
                l += chunk.length
                process.stdout.write(chunk)
            }
        }
        handler.encodeFinish(filename)
        console.warn(`${i} outer chunks totalling ${l} bytes`)
    })()
}
