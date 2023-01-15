import { createWriteStream, WriteStream } from "fs";
import { EOL } from "os";

export class TextWriter {

    private readonly _output: WriteStream;
    private _indent: number = 0;

    constructor(path: string) {
        this._output = createWriteStream(path, {
            flags: 'w'
        });
    }

    write(line: string): void {
        const indent = new Array(this._indent).fill('\t').join('');
        this._output.write(`${indent}${line}${EOL}`);
    }

    close(): void {
        this._output.end();
    }

    indent(): void {
        this._indent += 1;
    }

    outdent(): void {
        if (this._indent === 0) {
            throw new Error('Cannot outdent further.');
        }

        this._indent -= 1;
    }
    
}