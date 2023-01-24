import { CppToolset, ToolsetRegistry } from "@premake-core/core";

const clangToolset: CppToolset = {
    includes: function (directory: string): string {
        return `-I${directory}`;
    },
    externalIncludes: function (directory: string): string {
        return `-isystem ${directory}`;
    },
    defines: function (define: string): string {
        return `-D${define}`;
    },
    links: function (lib: string): string {
        return `-l${lib}`;
    },
    libraryDirectories: function (path: string): string {
        return `-L${path}`;
    },
    name: "clang",
    supportedLanguages: ["C", "C++"],
    supportedLanguageVersions: new Map(Object.entries({
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
    }
};

ToolsetRegistry.get().register(clangToolset);