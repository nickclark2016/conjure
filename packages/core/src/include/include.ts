import { APIAcceptedTypes, APIRegistry } from "../api";
import { State } from "../state";
import { readFileSync } from "fs";
import { dirname, join, normalize, relative, resolve } from "path";
import { Context, createContext, Script } from "vm";
import { FieldAPIInfo, FieldRegistry } from "../fields";
import { Toolset, ToolsetRegistry } from "../toolset";
import { Exporter, ExporterRegistry } from "../exporter";

export const includeFileStack: string[] = [];

class Code {
    private _source: string = "";

    private constructor(source: string) {
        this._source = source;
    }

    getRawSource(): string {
        return this._source;
    }

    static fromJavascriptFile(path: string): Code {
        const fullpath = resolve(includeFileStack.length > 0 ? includeFileStack[includeFileStack.length - 1] : "", path);
        const value = readFileSync(fullpath, { encoding: 'utf8' });

        return new Code(value);
    }
}

class Environment {
    private readonly _context: Context;

    constructor(context: any) {
        const ctx = Object.assign(context, {
            __apiRegistry: APIRegistry.get(),
            __setApiRegistry: (registry: APIRegistry) => APIRegistry.set(registry),
            __getApiRegistry: () => APIRegistry.get(),
            __fieldRegistry: FieldRegistry.get(),
            __setFieldRegistry: (registry: FieldRegistry) => FieldRegistry.set(registry),
            __getFieldRegistry: () => FieldRegistry.get(),
            __toolsetRegistry: ToolsetRegistry.get(),
            __setToolsetRegistry: (registry: ToolsetRegistry) => ToolsetRegistry.set(registry),
            __getToolsetRegistry: () => ToolsetRegistry.get(),
            __exporterRegistry: ExporterRegistry.get(),
            __setExporterRegistry: (registry: ExporterRegistry) => ExporterRegistry.set(registry),
            __getExporterRegistry: () => ExporterRegistry.get(),
            __state: State.get(),
            __setState: (state: State) => State.set(state),
            __getState: () => State.get(),
            console: console,
            conjure: {
                registerField: (info: FieldAPIInfo) => FieldRegistry.get().register(info),
                registerExporter: (info: Exporter) => ExporterRegistry.get().register(info),
                registerToolset: (info: Toolset) => ToolsetRegistry.get().register(info)
            }
        });
        this._context = createContext(ctx);
    }

    execute(source: Code) {
        const header = `__setState(__state); __setApiRegistry(__apiRegistry); __setFieldRegistry(__fieldRegistry); __setToolsetRegistry(__toolsetRegistry); __setExporterRegistry(__exporterRegistry);`;
        const footer = `__state = __getState(); __apiRegistry = __getApiRegistry(); __fieldRegistry = __getFieldRegistry(); __toolsetRegistry = __getToolsetRegistry(); __exporterRegistry = __getExporterRegistry();`;
        const fullSource = header + source.getRawSource() + footer;

        const script = new Script(fullSource);
        try {
            script.runInContext(this._context);
        } catch (err: any) {
            console.error(err.message);
        }
    }

    getContext(): Context {
        return this._context;
    }
}

export function include(src: string) {
    const working = process.cwd();

    const pathToSrc = normalize(relative(working, src));

    const code = Code.fromJavascriptFile(pathToSrc);
    const env = new Environment(APIRegistry.get().fetchApiTable());

    if (includeFileStack.length > 0) {
        const merged = normalize(join(includeFileStack[includeFileStack.length - 1], dirname(pathToSrc)));
        includeFileStack.push(merged);
    } else {
        includeFileStack.push(dirname(pathToSrc));
    }

    env.execute(code);
    includeFileStack.pop();

    return env.getContext().__state;
}

APIRegistry.get().register({
    name: "include",
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: [],
    acceptedArguments: [],
    action: include
});