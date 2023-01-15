import getopts from "getopts"
import * as fs from "fs"
import { DeduplicateStringsSort } from "../Processor/DeduplicateStringsSort"

const opts = getopts(process.argv, {
    boolean: ["d"]
})

const [filename] = opts._.slice(2)
const contents = fs.readFileSync(filename, {encoding: "utf-8"})

let handler: Generator<string>
if(opts.d) {
    handler = DeduplicateStringsSort.decode(contents)
} else {
    handler = DeduplicateStringsSort.encode(contents)
}
for(const chunk of handler) {
    process.stdout.write(chunk)
}