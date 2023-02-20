import { Toolset, ToolsetRegistry } from "@conjure/core";

const flagMapping: any = {
    includeDirs: (directory: string) => {
        return `-I${directory}`;
    },
    externalIncludeDirs: (directory: string) => {
        return `-isystem ${directory}`;
    },
    defines: (define: string) => {
        return `-D${define}`;
    },
    linksStatic: (lib: string) => {
        return `-l${lib}`;
    },
    libraryDirs: (path: string) => {
        return `-L${path}`;
    }
}

const clangToolset: Toolset = {
    name: "clang",
    supportedLanguages: new Map(Object.entries({
        "C": ["C11", "C17"],
        "C++": ["C++14", "C++17", "C++20", "C++Latest"],
    })),
    toolname: function (type: string, language: string): string {
        if (type === 'compiler') {
            if (language === 'C') {
                return 'clang';
            } else if (language === 'C++') {
                return 'clang++';
            } else {
                throw new Error(`Unexpected language ${language} for tool ${type}.`);
            }
        } else if (type === 'linker') {
            return 'ld';
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

ToolsetRegistry.get().register(clangToolset);