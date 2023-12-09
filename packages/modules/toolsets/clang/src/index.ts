import { CppToolset, DOMNode, Toolset, ToolsetRegistry } from "@conjure/core";
import { extname } from "path";

const shared = {
    optimize: {
        Off: '-O0',
        On: '-O2',
        Debug: '-Og',
        Speed: '-O3',
        Size: '-Os',
        Full: '-O3',
    },
    compileAs: {
        'C': '--language=C',
        'C++': '--language=C++',
    },
    symbols: {
        On: '-g',
    },
    warnings: {
        Off: '-w',
        High: '-Wall',
        Extra: '-Wall -Wextra',
        Everything: '-Weverything',
    },
}

const cFlags = {
    languageVersion: {
        'C11': '-std=c11',
        'C17': '-std=c17',
    },
}

const cxxFlags = {
    languageVersion: {
        'C++14': '-std=c++14',
        'C++17': '-std=c++17',
        'C++20': '-std=c++20',
        'C++Latest': '-std=c++23',
    },
}

const linkFlags = {
    kind: {
        SharedLib: '-shared',
        StaticLib: 'rcs', // replace existing files, create if does not exist, create object-file index
        Console: '',
    }
}

const flagMapping: any = {
    includeDirs: (directory: string) => {
        return `-I${directory}`;
    },
    externalIncludeDirs: (directory: string) => {
        return `-isystem${directory}`;
    },
    defines: (define: string) => {
        return `-D${define}`;
    },
    linksStatic: (lib: string) => {
        const ext = extname(lib);
        if (ext) {
            return `-l${lib}`;
        }
        return `-l:${lib}`;
    },
    libraryDirs: (path: string) => {
        return `-L${path}`;
    },
    intermediateExtension: (_: string) => {
        return '.o';
    },
    targetExtension: (type: string) => {
        if (type === 'ConsoleApp') {
            return '';
        } else if (type === 'StaticLib') {
            return '.a';
        } else if (type === 'SharedLib') {
            return '.so';
        }
        return undefined;
    },
}

class ClangToolset implements CppToolset {
    name = "clang";
    
    supportedLanguages = new Map(Object.entries({
        "C": ["C11", "C17"],
        "C++": ["C++14", "C++17", "C++20", "C++Latest"],
    }));

    toolname = function (type: string, language: string): string {
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
        } else if (type === 'archive') {
            return 'llvm-ar';
        }
        throw new Error(`Unexpected tool type: ${type}.`);
    }

    mapFlag = function (name: string, value: string): string {
        const fn = flagMapping[name];
        if (fn) {
            return fn(value);
        } else {
            throw new Error(`Flag [${name}] unsupported for toolset clang`);
        }
    }

    private mapFlags = function (cfg: DOMNode, flagTable: any): string[] {
        const keys = Object.keys(flagTable);
        const flags = keys.filter(key => cfg[key] !== undefined).map(key => {
            return flagTable[key][cfg[key]];
        }).filter(flag => flag !== null && flag !== undefined);
        return flags;
    }

    getCFlags(cfg: DOMNode): string[] {
        const sharedFlags = this.mapFlags(cfg, shared);
        const cflags = this.mapFlags(cfg, cFlags);

        return [...sharedFlags, ...cflags];
    }

    getCppFlags(_cfg: DOMNode): string[] {
        return []
    }

    getCxxFlags(cfg: DOMNode): string[] {
        const sharedFlags = this.mapFlags(cfg, shared);
        const cxxflags = this.mapFlags(cfg, cxxFlags);

        return [...sharedFlags, ...cxxflags];
    }

    getLinkFlags(cfg: DOMNode): string[] {
        const libDirs: string[] = cfg.libraryDirs || [];

        const linkerFlags = this.mapFlags(cfg, linkFlags);
        const libDirFlags = libDirs.map(dir => this.mapFlag('libraryDirs', dir));

        const flags = [...libDirFlags, ...linkerFlags].filter(flag => flag);

        return flags;
    }
};

const clangToolset: Toolset = new ClangToolset();

ToolsetRegistry.get().register(clangToolset);