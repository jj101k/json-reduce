import getopts from "getopts"
import * as fs from "fs"
import { DeduplicateStrings } from "../Processor/DeduplicateStrings"

const opts = getopts(process.argv, {
    boolean: ["d"]
})

const [filename] = opts._.slice(2)
const contents = fs.readFileSync(filename, {encoding: "utf-8"})

let handler: Generator<string>
if(opts.d) {
    handler = DeduplicateStrings.decode(contents)
} else {
    handler = DeduplicateStrings.encode(contents)
}
for(const chunk of handler) {
    process.stdout.write(chunk)
}