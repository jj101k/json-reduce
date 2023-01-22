export abstract class Local {
    static debug = false

    static shortenIfNeeded(contents: string) {
        if (contents.match(/^[\[{]\r?\n/s)) {
            return JSON.stringify(JSON.parse(contents))
        } else {
            return contents
        }
    }
}