import getopts from "getopts"
import * as fs from "fs"
import { DeduplicateStringsRepass } from "../Processor/DeduplicateStringsRepass"

const opts = getopts(process.argv, {
    boolean: ["d"]
})

const [filename] = opts._.slice(2)
const contents = fs.readFileSync(filename, {encoding: "utf-8"})

let handler: Generator<string>
if(opts.d) {
    handler = DeduplicateStringsRepass.decode(contents)
} else {
    handler = DeduplicateStringsRepass.encode(contents)
}
for(const chunk of handler) {
    process.stdout.write(chunk)
}