import pako from "pako"

export class ReferencePureJS {
    static *encode(contents: string) {
        yield Buffer.from(pako.gzip(contents)).toString("base64")
    }

    static *decode(contents: string) {
        yield pako.inflate(Buffer.from(contents, "base64"), {to: "string"})
    }
}