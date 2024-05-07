export const vs2022: any = {
    version: '2022',
    vcxproj: {
        externalIncludesSupported: true,
        defaults: {
            cppversion: 'C++20',
            cversion: 'C11',
            toolset: 'v143'
        },
        toolsets: {
            'msc:141': 'v141',
            'msc:142': 'v142',
            'msc:143': 'v143',
            'clang': 'ClangCL',
        },
        kind: {
            Executable: {
                Name: 'Application',
                Extension: '.exe',
                Subsystem: 'Console',
            },
            StaticLib: {
                Name: 'StaticLibrary',
                Extension: '.lib',
                Subsystem: 'Windows',
            },
            SharedLib: {
                Name: 'DynamicLibrary',
                Extension: '.dll',
                Subsystem: 'Windows',
            },
        },
        extensions: {
            Headers: [
                '.h',
                '.hh',
                '.hpp',
                '.hxx',
                '.tpp',
                '.inl',
            ],
            Compiled: [
                '.c',
                '.cc',
                '.cpp',
                '.cxx',
                '.cppm',
                '.ixx',
            ]
        },
        optimizations: {
            Off: 'Disabled',
            On: 'MaxSpeed',
            Speed: 'MaxSpeed',
            Size: 'MinSpace',
            Full: 'Full',
        },
        warningLevel: {
            Off: 'TurnOffAllWarnings',
            High: 'Level3',
            Extra: 'Level4',
            Everything: 'EnableAllWarnings',
            Default: 'Level3',
        },
        runtimes: {
            Debug: {
                Off: 'MultiThreadedDebugDLL',
                On: 'MultiThreadedDebug',
            },
            Release: {
                Off: 'MultiThreadedDLL',
                On: 'MultiThreaded',
            }
        },
        versions: {
            C: {
                C11: 'stdc11',
                C17: 'stdc17',
            },
            'C++': {
                'C++14': 'stdcpp14',
                'C++17': 'stdcpp17',
                'C++20': 'stdcpp20',
                'C++Latest': 'stdcpplatest',
            }
        },
        enableModules: {
            On: 'true',
            Off: 'false',
        },
        buildStlModules: {
            On: 'true',
            Off: 'false',
        }
    }
}