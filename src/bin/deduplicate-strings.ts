import getopts from "getopts"
import * as fs from "fs"
import { DeduplicateStrings } from "../Processor/DeduplicateStrings"

const opts = getopts(process.argv, {
    boolean: ["d"]
})

const [filename] = opts._.slice(2)
const contents = fs.readFileSync(filename, {encoding: "utf-8"})

const handler = new DeduplicateStrings()
let handlerChunks: Generator<string>
if(opts.d) {
    handlerChunks = handler.decode(contents)
} else {
    handlerChunks = handler.encode(contents)
}
for(const chunk of handlerChunks) {
    process.stdout.write(chunk)
}