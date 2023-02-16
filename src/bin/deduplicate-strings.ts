import * as fs from "fs"
import getopts from "getopts"
import { Decode, Encode } from ".."

const opts = getopts(process.argv, {
    boolean: ["d"]
})

const [filename] = opts._.slice(2)
const contents = fs.readFileSync(filename, {encoding: "utf-8"})

let handlerChunks: Generator<string>
if(opts.d) {
    const handler = new Decode.SinglePass()
    handlerChunks = handler.decode(contents)
} else {
    const handler = new Encode.SinglePass.Unsorted()
    handlerChunks = handler.encode(contents)
}
for(const chunk of handlerChunks) {
    process.stdout.write(chunk)
}