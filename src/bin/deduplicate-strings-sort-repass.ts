import * as fs from "fs"
import getopts from "getopts"
import { DeduplicateStringsSortRepass } from "../Processor/DeduplicateStringsSortRepass"

const opts = getopts(process.argv, {
    boolean: ["d"]
})

const [filename] = opts._.slice(2)
const contents = fs.readFileSync(filename, {encoding: "utf-8"})

let handler: Generator<string>
if(opts.d) {
    handler = DeduplicateStringsSortRepass.decode(contents)
} else {
    handler = DeduplicateStringsSortRepass.encode(contents)
}
for(const chunk of handler) {
    process.stdout.write(chunk)
}