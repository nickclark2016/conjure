import { State } from "@premake-core/core";
import { Context, createContext, Script } from "vm";
import { Code } from "./code";

export class Environment {
    private readonly _context: Context;

    constructor(context: any) {
        const state = State.get();
        const ctx = Object.assign({}, context, state);
        this._context = createContext(ctx);
    }

    execute(source: Code) {
        const script = new Script(source.getRawSource());
        try {
            script.runInContext(this._context);
        } catch (err) {
            console.error(err);
        }
    }
}