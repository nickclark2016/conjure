import { TextWriter } from "./text";

export class XmlWriter {
    private _writer: TextWriter;
    
    constructor(path: string) {
        this._writer = new TextWriter(path);
        this._writer.write(`<?xml version="1.0" encoding="utf-8"?>`);
    }

    writeNode(element: string, attributes: any, callback: (writer: XmlWriter) => void): void {
        const tagContents = [element, ... this._computeAttributeString(attributes)].join(" ");

        this._writer.write(`<${tagContents}>`);
        this._writer.indent();
        callback(this);
        this._writer.outdent();
        this._writer.write(`</${element}>`)
    }

    writeContentNode(element: string, attributes: any, content: string | null = null) {
        const tagContents = [element, ... this._computeAttributeString(attributes)].join(" ");
        if (content) {
            this._writer.write(`<${tagContents}>${content}</${element}>`);
        } else {
            this._writer.write(`<${tagContents} />`)
        }
    }

    close(): void {
        this._writer.close();
    }

    private _computeAttributeString(attributes: any) {
        return Object.entries(attributes).map(([key, value]) => {
            return `${key}="${value}"`;
        });
    }
}