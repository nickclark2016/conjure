import { CppToolset, DOMNode, Toolset, ToolsetRegistry } from "@conjure/core";

const shared = {
    clr: {
        On: '/clr',
        Unsafe: '/clr',
        Pure: '/clr:pure',
        Safe: '/clr:safe',
    },
    compileAs: {
        'C': '/TC',
        'C++': '/TP',
    },
    externalWarnings: {
        Off: '/external:W0',
        High: '/external:W3',
        Extra: '/external:W4',
        Everything: '/external:Wall',
        Default: '/external:W3',
    },
    optimize: {
        Off: '/Od',
        On: '/Ot',
        Speed: '/O2',
        Size: '/O1',
        Full: '/Ox',
    },
    symbols: {
        On: '/ZI /FS',
    },
    warnings: {
        Off: '/W0',
        High: '/W3',
        Extra: '/W4',
        Everything: '/Wall',
        Default: '/W3',
    },
}

const cFlags = {
    languageVersion: {
        'C11': '/std:c11',
        'C17': '/std:c17',
    },
}

const cxxFlags = {
    languageVersion: {
        'C++14': '/std:c++14',
        'C++17': '/std:c++17',
        'C++20': '/std:c++20',
        'C++Latest': '/std:c++latest',
    },
}

const linkFlags = {
    kind: {
        SharedLib: '/DLL',
        StaticLib: '/SUBSYSTEM:Console',
        Console: '/SUBSYSTEM:Console'
    },
};

const machine: any = {
    'x86': 'X86',
    'Win32': 'X86',
    'x64': 'X64',
};

const runtimes: any = {
    Debug: {
        Off: '/MDd',
        On: '/MTd',
    },
    Release: {
        Off: '/MD',
        On: '/MT',
    }
}

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
        return `/LIBPATH:${path}`;
    },
    intermediateExtension: (_: string) => {
        return '.obj';
    },
    targetExtension: (type: string) => {
        if (type === 'ConsoleApp') {
            return '.exe';
        } else if (type === 'StaticLib') {
            return '.lib';
        } else if (type === 'SharedLib') {
            return '.dll';
        }
        return undefined;
    },
};

class MSCToolset implements CppToolset {
    name = "msc";

    supportedLanguages = new Map(Object.entries({
        "C": ["C11", "C17"],
        "C++": ["C++14", "C++17", "C++20", "C++Latest"],
    }));

    toolname = function (type: string, _language: string): string {
        if (type === 'compiler') {
            return 'cl';
        } else if (type === 'linker') {
            return 'cl';
        } else if (type === 'archive') {
            return 'lib';
        }
        throw new Error(`Unexpected tool type: ${type}.`);
    }

    mapFlag = function (name: string, value: string): string {
        const fn = flagMapping[name];
        if (fn) {
            return fn(value);
        } else {
            throw new Error(`Flag [${name}] unsupported for toolset msc`);
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
        const staticRt = cfg.staticRuntime || 'Off';
        const runtime = cfg.runtime || 'Release';

        const sharedFlags = this.mapFlags(cfg, shared);
        const runtimeFlags = [runtimes[runtime][staticRt]];
        const cflags = this.mapFlags(cfg, cFlags);

        return [...sharedFlags, ...runtimeFlags, ...cflags];
    }

    getCppFlags(_cfg: DOMNode): string[] {
        return []
    }

    getCxxFlags(cfg: DOMNode): string[] {
        const staticRt = cfg.staticRuntime || 'Off';
        const runtime = cfg.runtime || 'Release';

        const sharedFlags = this.mapFlags(cfg, shared);
        const runtimeFlags = [runtimes[runtime][staticRt]];
        const cxxflags = this.mapFlags(cfg, cxxFlags);

        return ['/EHsc', ...sharedFlags, ...runtimeFlags, ...cxxflags];
    }

    getLinkFlags(cfg: DOMNode): string[] {
        const libDirs: string[] = cfg.libraryDirs || [];

        const linkerFlags = this.mapFlags(cfg, linkFlags);
        const libDirFlags = libDirs.map(dir => this.mapFlag('libraryDirs', dir));
        const defaultLibs = [
            "kernel32.lib",
            "user32.lib",
            "gdi32.lib",
            "winspool.lib",
            "comdlg32.lib",
            "advapi32.lib",
            "shell32.lib",
            "ole32.lib",
            "oleaut32.lib",
            "uuid.lib",
            "odbc32.lib",
            "odbccp32.lib",
        ];

        const isNotArchive = cfg.kind === 'ConsoleApp' || cfg.kind === 'SharedLib';

        const flags = (() => {
            if (cfg.kind === 'StaticLib') {
                return [];
            }

            const flags = ['/nologo', ...libDirFlags, ...defaultLibs, ...linkerFlags].filter(flag => flag);
            if (isNotArchive && cfg.symbols === 'On') {
                flags.push('/DEBUG');
            }
            return flags;
        })();

        const arch = `/MACHINE:${machine[cfg.platform]}`;

        flags.push(arch);

        return flags;
    }
};

const mscToolset: Toolset = new MSCToolset();

ToolsetRegistry.get().register(mscToolset);