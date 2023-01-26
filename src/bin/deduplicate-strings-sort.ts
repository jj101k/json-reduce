import getopts from "getopts"
import * as fs from "fs"
import { DeduplicateStringsSort } from "../Processor/DeduplicateStringsSort"

const opts = getopts(process.argv, {
    boolean: ["d"]
})

const [filename] = opts._.slice(2)
const contents = fs.readFileSync(filename, {encoding: "utf-8"})

const handler = new DeduplicateStringsSort()
let handlerChunks: Generator<string>
if(opts.d) {
    handlerChunks = handler.decode(contents)
} else {
    handlerChunks = handler.encode(contents)
}
for(const chunk of handlerChunks) {
    process.stdout.write(chunk)
}