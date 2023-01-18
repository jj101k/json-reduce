export abstract class Local {
    static debug = true

    static shortenIfNeeded(contents: string) {
        if (contents.match(/^[\[{]\r?\n/s)) {
            return JSON.stringify(JSON.parse(contents))
        } else {
            return contents
        }
    }
}