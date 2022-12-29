import { readFile } from "fs/promises";

export class Code {
    private _source: string = "";
    
    private constructor(source: string) {
        this._source = source;
    }

    getRawSource(): string {
        return this._source;
    }

    static fromJavascriptFile(path: string): Promise<Code> {
        const value = readFile(path, { encoding: 'utf8' }).then((value: string) => {
            return new Code(value);
        });

        return value;
    }
}