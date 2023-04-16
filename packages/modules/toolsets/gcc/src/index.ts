import { Toolset, ToolsetRegistry } from "@conjure/core";

const flags: any = {
    common: {
        architecture: {
            x86: '-m32',
            x64: '-m64'
        },
        floatingPoint: {
            Fast: '-ffast-math',
            Strict: '-ffloat-store'
        },
        optimize: {
            Off: '-O0',
            On: '-O2',
            Full: '-O3',
            Size: '-Os',
            Speed: '-O3'
        },
        warnings: {
            On: '',
            Off: '-w',
            High: '-Wall',
            Extra: '-Wall -Wextra',
            Everthing: '-Weverything'
        },
        externalWarnings: {
            Off: '',
            On: '-Wsystem-headers',
            High: '-Wsystem-headers',
            Extra: '-Wsystem-headers',
            Everything: '-Wsystem-headers'
        },
        symbols: {
            Off: '',
            On: '-g -ggdb3'
        }
    },
    cflags: {
        languageVersion: {
            'C11': '-std=c11',
            'C17': '-std=c17'
        },
    },
    cppflags: {
        system: {
            linux: '-MD -MP',
            windows: '-MD -MP'
        }
    },
    cxxflags: {
        languageVersion: {
            'C++14': '-std=c++14',
            'C++17': '-std=c++17',
            'C++20': '-std=c++20',
            'C++Latest': '-std=c++2b'
        }
    },
    ldflags: {
        architecture: {
            x86: '/usr/lib32',
            x64: '/usr/lib64'
        },
        symbols: {
            Off: '-s',
            On: ''
        }
    }
};

const flagMapping: any = {
    includeDirs: (directory: string) => `-I${directory}`,
    externalIncludeDirs: (directory: string) => `-isystem ${directory}`,
    defines: (define: string) => `-D${define}`,
    linksStatic: (lib: string) => `-l${lib}`,
    libraryDirs: (path: string) => `-L${path}`,
    architecture: (arch: string) => flags.common.architecture[arch],
    optimize: (level: string) => flags.common.optimize[level],
    symbols: (status: string) => flags.common.symbols[status],
    warnings: (level: string) => flags.common.warnings[level],
    externalWarnings: (level: string) => flags.common.externalWarnings[level],
    cVersion: (version: string) => flags.cflags.languageVersion[version],
    cppVersion: (version: string) => flags.cxxflags.languageVersion[version],
    commonSystemFlags: (system: string) => flags.cppflags.system[system],
    defaultLibraryDirectory: (arch: string) => flags.ldflags.architecture[arch],
    linkerSymbols: (symbols: string) => flags.ldflags.symbols[symbols],
}

const gccToolset: Toolset = {
    name: "gcc",
    supportedLanguages: new Map(Object.entries({
        "C": ["C11", "C17"],
        "C++": ["C++14", "C++17", "C++20", "C++Latest"],
    })),
    toolname: function (type: string, language: string): string {
        if (type === 'compiler') {
            if (language === 'C') {
                return 'gcc';
            } else if (language === 'C++') {
                return 'g++';
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

ToolsetRegistry.get().register(gccToolset);