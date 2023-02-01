import { FieldRegistry } from "../fields";

/**
 * Base toolset interface.  Used to describe what tools are in the toolset
 * and what languages are supported by a toolset.
 */
export interface Toolset {
    /**
     * Name of the toolset.  This is used by the toolset script API to fetch
     * the appropriate toolset.
     */
    name: string;
    
    /**
     * A map of supported languages and versions. The key is the name of the
     * language and the value is a string representing the supported language
     * versions.
     */
    supportedLanguages: Map<string, string[]>;

    /**
     * A function that fetches the name of a tool for a given type (compiler,
     * linker, etc.) and language
     * 
     * @param type Type of the tool (compiler, linker, etc.)
     * @param language Language to fetch the tool for (C, C++, C#, etc.)
     * @returns Name of the tool
     * @throws Error if no such tool exists
     */
    toolname: (type: string, language: string) => string;
}

/**
 * Extension of {@link Toolset} for C++ toolsets.
 */
export interface CppToolset extends Toolset {
    /**
     * Function mapping a directory path to an include flag
     * 
     * @param directory Path to directory to include
     * @returns Include flag for directory
     */
    includes: (directory: string) => string;

    /**
     * Function mapping a directory path to an external include flag
     * 
     * @param directory Path to directory to external include
     * @returns External include flag for directory
     */
    externalIncludes: (directory: string) => string;

    /**
     * Function mapping a preprocessor definition to a define flag
     * 
     * @param define Preprocessor definition
     * @returns Define flag
     */
    defines: (define: string) => string;

    /**
     * Function mapping a file to link against to the linker flag
     * 
     * @param lib Library name to link against
     * @returns Linker flag to link library
     */
    links: (lib: string) => string;

    /**
     * Function mapping a directory to a flag to specify a linker search path
     * 
     * @param path Path to search for libraries in
     * @returns Linker flag specifying search path
     */
    libraryDirectories: (path: string) => string;
};

/**
 * Registry for toolsets.  Allows for global access of toolsets to register, fetch
 * and remove toolsets.
 */
export class ToolsetRegistry {
    private static _instance: ToolsetRegistry = new ToolsetRegistry();
    private readonly _toolsets = new Map<string, Toolset>();

    private constructor() { }

    /**
     * Gets the global registry instance
     * 
     * @returns registry instance 
     */
    static get(): ToolsetRegistry {
        return ToolsetRegistry._instance;
    }

    /**
     * Sets the global registry instance
     * 
     * @param registry registry instance 
     */
    static set(registry: ToolsetRegistry) {
        this._instance = registry;
    }

    /**
     * Registers a new toolset
     * 
     * @param toolset Toolset to register
     * @throws Error if toolset exists with given name 
     */
    register(toolset: Toolset) {
        if (this._toolsets.has(toolset.name)) {
            FieldRegistry.get().fetch('language')?.addAcceptedArguments(...toolset.supportedLanguages.keys());
            throw new Error(`Toolset with name ${toolset.name} already exists.`);
        }
        this._toolsets.set(toolset.name, toolset);
    }

    /**
     * Fetches a toolset given a name
     * 
     * @param name Name of the toolset to fetch
     * @returns Toolset if it exists or null
     */
    fetch(name: string): Toolset | null {
        const [toolname, _] = name.split(':');
        return this._toolsets.get(toolname) || null;
    }

    /**
     * Removes a toolset given a name
     * 
     * @param name Name of the toolset to remove
     * @returns True if a toolset was removed, else false
     */
    remove(name: string): boolean {
        return this._toolsets.delete(name);
    }

    /**
     * Removes all toolsets in the registry
     */
    reset(): void {
        this._toolsets.clear();
    }
};