const child_process = require("child_process")

class Reference {
    static encode(contents) {
        return [child_process.execSync("gzip -c", {input: contents, maxBuffer: 100_000_000}).toString("base64")]
    }

    static decode(contents) {
        return [child_process.execSync("gzip -cd", {input: Buffer.from(contents, "base64"), encoding: "utf-8", maxBuffer: 100_000_000})]
    }
}

module.exports = Reference