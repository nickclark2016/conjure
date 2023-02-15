import { Toolset, ToolsetRegistry } from "@premake-core/core";

const flagMapping: any = {
    includeDirs: (directory: string) => {
        return `/I ${directory}`;
    },
    externalIncludeDirs: (directory: string) => {
        return `/external:I ${directory}`;
    },
    defines: (define: string) => {
        return `/D ${define}`;
    },
    linksStatic: (lib: string) => {
        return `${lib}`
    },
    libraryDirs: (path: string) => {
        return `/LIBPATH ${path}`;
    }
};

const mscToolset: Toolset = {
    name: "msc",
    supportedLanguages: new Map(Object.entries({
        "C": ["C11", "C17"],
        "C++": ["C++14", "C++17", "C++20", "C++Latest"],
    })),
    toolname: function (type: string, _language: string): string {
        if (type === 'compiler') {
            return 'CL.exe';
        } else if (type === 'linker') {
            return 'LINK.exe';
        }
        throw new Error(`Unexpected tool type: ${type}.`);
    },
    mapFlag: function(name: string, value: string): string {
        const fn = flagMapping[name];
        if (fn) {
            return fn(value);
        } else {
            throw new Error(`Flag [${name}] unsupported for toolset msc`);
        }
    },
};

ToolsetRegistry.get().register(mscToolset);