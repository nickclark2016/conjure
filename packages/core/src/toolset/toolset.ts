import { FieldRegistry } from "../fields";

export interface Toolset {
    name: string;
    supportedLanguages: string[];
    supportedLanguageVersions: Map<string, string[]>;
    toolname: (type: string, language: string) => string;
}

export interface CppToolset extends Toolset {
    includes: (directory: string) => string;
    externalIncludes: (directory: string) => string;
    defines: (define: string) => string;
    links: (lib: string) => string;
    libraryDirectories: (path: string) => string;
};

export class ToolsetRegistry {
    private static _instance: ToolsetRegistry = new ToolsetRegistry();
    private readonly _toolsets = new Map<string, Toolset>();

    private constructor() {}

    static get(): ToolsetRegistry {
        return ToolsetRegistry._instance;
    }

    static set(registry: ToolsetRegistry) {
        this._instance = registry;
    }

    register(toolset: Toolset) {
        if (this._toolsets.has(toolset.name)) {
            FieldRegistry.get().fetch('language')?.addAcceptedArguments(...toolset.supportedLanguages);
            throw new Error(`Toolset with name ${toolset.name} already exists.`);
        }
        this._toolsets.set(toolset.name, toolset);
    }

    fetch(name: string): Toolset | null {
        const [toolname, _] = name.split(':');
        return this._toolsets.get(toolname) || null;
    }

    remove(name: string): boolean {
        return this._toolsets.delete(name);
    }

    reset(): void {
        this._toolsets.clear();
    }
};