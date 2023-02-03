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
    let totalLength = 0
    for(const chunk of handlerChunks) {
        totalLength += chunk.length
        process.stdout.write(chunk)
    }
    console.warn(`${totalLength} bytes`)
} else {
    fsPromises.open(filename).then(
        fd => handler.encodeStream(fd, process.stdout)
    )
}
