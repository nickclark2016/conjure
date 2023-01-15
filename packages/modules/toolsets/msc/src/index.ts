import { CppToolset, FieldRegistry, ToolsetRegistry } from "@premake-core/core";

const mscToolset: CppToolset = {
    includes: function (directory: string): string {
        return `/I ${directory}`;
    },
    externalIncludes: function (directory: string): string {
        return `/external:I ${directory}`;
    },
    defines: function (define: string): string {
        return `/D ${define}`;
    },
    links: function (lib: string): string {
        return `${lib}`;
    },
    libraryDirectories: function (path: string): string {
        return `/LIBPATH ${path}`;
    },
    name: "msc",
    supportedLanguages: ["C", "C++"],
    supportedLanguageVersions: new Map(Object.entries({
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
    }
};

ToolsetRegistry.get().register(mscToolset);

const languages = FieldRegistry.get().fetch("language");
if (languages) {
    languages.addAcceptedArguments("C#");
}