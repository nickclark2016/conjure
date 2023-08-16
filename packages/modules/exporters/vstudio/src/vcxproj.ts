import { DOMNode, XmlWriter } from "@conjure/core";
import { dirname, extname, join, relative } from "path";
import { vs2022 } from "./vs2022";

const defaults: any = {
    vs2022
}

const toolsetNameMap: any = {
    'msc:141': 'v141',
    'msc:142': 'v142',
    'msc:143': 'v143',
    'clang': 'ClangCL'
};

const kindMap: any = {
    'ConsoleApp': 'Application',
    'StaticLib': 'StaticLibrary',
    'SharedLib': 'DynamicLibrary'
};

const targetExtensionMap: any = {
    'ConsoleApp': '.exe',
    'StaticLib': '.lib',
    'SharedLib': '.dll'
};

const subsystemMap: any = {
    'ConsoleApp': 'Console',
    'StaticLib': 'Windows',
    'SharedLib': 'Windows'
};

const itemTypeExtensionMap: any = {
    'ClInclude': [
        '.h',
        '.hh',
        '.hpp',
        '.hxx',
        '.tpp',
    ],
    'ClCompile': [
        '.c',
        '.cc',
        '.cpp',
        '.cxx',
        '.cppm',
        '.ixx'
    ]
};

const optimizationMap: any = {
    'Off': 'Disabled',
    'On': 'MaxSpeed',
    'Speed': 'MaxSpeed',
    'Size': 'MinSpace',
    'Full': 'Full'
};

const warningLevelMap: any = {
    'Off': 'TurnOffAllWarnings',
    'High': 'Level3',
    'Extra': 'Level4',
    'Everything': 'EnableAllWarnings',
    'Default': 'Level3'
};

const runtimeMap: any = {
    'Debug': {
        'Off': 'MultiThreadedDebugDLL',
        'On': 'MultiThreadedDebug'
    },
    'Release': {
        'Off': 'MultiThreadedDLL',
        'On': 'MultiThreaded'
    }
}

const versionMap: any = {
    'C': {
        'C11': 'stdc11',
        'C17': 'stdc17'
    },
    'C++': {
        'C++14': 'stdcpp14',
        'C++17': 'stdcpp17',
        'C++20': 'stdcpp20',
        'C++Latest': 'stdcpplatest'
    },
}

function writeConfigurationGroups(prj: DOMNode, writer: XmlWriter) {
    writer.writeNode("ItemGroup", { Label: "ProjectConfigurations" }, (writer: XmlWriter) => {
        prj.getChildren().filter((node) => node.apiName === 'when').forEach((node) => {
            writer.writeNode("ProjectConfiguration", { Include: `${node.configuration}|${node.platform}` }, (writer) => {
                writer.writeContentNode("Configuration", {}, node.configuration);
                writer.writeContentNode("Platform", {}, node.platform);
            });
        });
    });
}

function writeGlobalPropertyGroup(prj: DOMNode, writer: XmlWriter) {
    writer.writeNode("PropertyGroup", { Label: "Globals" }, (writer: XmlWriter) => {
        writer.writeContentNode("ProjectGuid", {}, `{${prj.uuid}}`);
        writer.writeContentNode("IgnoreWarningCompileDuplicatedFilename", {}, "true");
        writer.writeContentNode("Keyword", {}, "Win32Proj"); // Do I need to fetch this from somewhere?
        writer.writeContentNode("RootNamespace", {}, prj.getName());
    });
}

function writeDefaultProps(_: DOMNode, writer: XmlWriter) {
    writer.writeContentNode("Import", { Project: "$(VCTargetsPath)\\Microsoft.Cpp.Default.props" });
}

function writeProps(_: DOMNode, writer: XmlWriter) {
    writer.writeContentNode("Import", { Project: "$(VCTargetsPath)\\Microsoft.Cpp.props" });
    writer.writeNode("ImportGroup", { Label: "ExtensionSettings" }, (_) => { });
}

function writeConfigurationProps(prj: DOMNode, writer: XmlWriter) {
    const useDebugLibs = (cfg: DOMNode) => {
        const debugSymbols = cfg.debugSymbols;
        const config = cfg.configuration;
        if (debugSymbols && debugSymbols !== 'Off') {
            return true;
        }
        if (config === 'Debug') {
            return true;
        }
        return false;
    }

    prj.getChildren().filter((node) => node.apiName === 'when').forEach((node) => {
        const cfg = node.configuration;
        const platform = node.platform;
        writer.writeNode("PropertyGroup", {
            Condition: `'$(Configuration)|$(Platform)'=='${cfg}|${platform}'`,
            Label: 'Configuration'
        }, (writer) => {
            writer.writeContentNode("ConfigurationType", {}, kindMap[node.kind]);
            writer.writeContentNode("UseDebugLibraries", {}, `${useDebugLibs(node)}`);
            writer.writeContentNode("CharacterSet", {}, "Unicode");
            writer.writeContentNode("PlatformToolset", {}, toolsetNameMap[node.toolset || defaults.vs2022.vcxproj.defaults.toolset]);
        });
    });
}

function writePropertySheets(prj: DOMNode, writer: XmlWriter) {
    prj.getChildren().filter((node) => node.apiName === 'when').forEach((node) => {
        writer.writeNode("ImportGroup", {
            Label: "PropertySheets",
            Condition: `'$(Configuration)|$(Platform)'=='${node.configuration}|${node.platform}'`
        }, (writer) => {
            const fileName = `$(UserRootDir)\\Microsoft.Cpp.$(Platform).user.props`;
            writer.writeContentNode("Import", {
                Project: fileName,
                Condition: `exists('${fileName}')`,
                Label: "LocalAppDataPlatform"
            });
            // TODO: Write the rest of the property sheets from user specification
        });
    });
}

function writePropertyLinkerConfiguration(prj: DOMNode, writer: XmlWriter) {
    prj.getChildren().filter((node) => node.apiName === 'when').forEach((node) => {
        const linkIncremental = node.configuration === 'Debug';
        const intDir: string = node.intermediateDirectory || 'obj';
        const binDir: string = node.targetDirectory || 'bin';
        const targetName = node.targetName || prj.getName();
        const targetExt = node.targetExt || targetExtensionMap[node.kind];

        writer.writeNode("PropertyGroup", {
            Condition: `'$(Configuration)|$(Platform)'=='${node.configuration}|${node.platform}'`
        }, (writer) => {
            writer.writeContentNode("LinkIncremental", {}, `${linkIncremental}`);
            writer.writeContentNode("OutDir", {}, `${binDir}\\`);
            writer.writeContentNode("IntDir", {}, `${intDir}\\`);
            writer.writeContentNode("TargetName", {}, targetName);
            writer.writeContentNode("TargetExt", {}, targetExt);
        });
    });
}

function writeItemDefinitionGroups(prj: DOMNode, writer: XmlWriter) {
    prj.getChildren().filter((node) => node.apiName === 'when').forEach((node) => {
        writer.writeNode("ItemDefinitionGroup", {
            Condition: `'$(Configuration)|$(Platform)'=='${node.configuration}|${node.platform}'`
        }, (writer) => {
            writer.writeNode("ClCompile", {}, (writer) => {
                writer.writeContentNode("PrecompiledHeader", {}, "NotUsing"); // TODO: Search for PCH

                const warningLevel = node.warnings || 'Default';
                writer.writeContentNode("WarningLevel", {}, warningLevelMap[warningLevel]);

                const defines: string[] = node.defines || [];
                defines.push("%(PreprocessorDefinitions)");
                writer.writeContentNode("PreprocessorDefinitions", {}, defines.join(";"));

                const includes: string[] = node.includeDirs || [];
                includes.push("%(AdditionalIncludeDirectories)")
                writer.writeContentNode("AdditionalIncludeDirectories", {}, includes.join(";"));

                const symbols = node.symbols;
                if (symbols && symbols !== 'Off') {
                    writer.writeContentNode("DebugInformationFormat", {}, "EditAndContinue");
                }

                const optimize = node.optimize;
                if (optimize) {
                    const flag = optimizationMap[optimize];
                    writer.writeContentNode("Optimization", {}, flag);
                }

                if (optimize && optimize !== 'Off') {
                    writer.writeContentNode("FunctionLevelLinking", {}, "true");
                    writer.writeContentNode("IntrinsicFunctions", {}, "true");
                    writer.writeContentNode("StringPooling", {}, "true");
                }

                const staticRt = node.staticRuntime || 'Off';
                const runtime = node.runtime || 'Release';
                writer.writeContentNode("RuntimeLibrary", {}, runtimeMap[runtime][staticRt]);

                writer.writeContentNode("MultiProcessorCompilation", {}, "true");
                const langVersion = prj.languageVersion;
                if (prj.language === 'C++') {
                    writer.writeContentNode("LanguageStandard", {}, versionMap['C++'][langVersion || defaults.vs2022.vcxproj.defaults.cppversion]);
                } else if (prj.language === 'C') {
                    writer.writeContentNode("LanguageStandard_C", {}, versionMap['C'][langVersion || defaults.vs2022.vcxproj.defaults.cversion]);
                } else {
                    throw new Error(`Unsupported language: ${prj.language}`);
                }

                const externalWarningLevel = node.externalWarnings || 'Default';
                writer.writeContentNode("ExternalWarningLevel", {}, warningLevelMap[externalWarningLevel]);
            });

            writer.writeNode("Link", {}, (writer) => {
                writer.writeContentNode("SubSystem", {}, subsystemMap[node.kind]);

                const symbols = node.symbols;
                if (symbols && symbols !== 'Off') {
                    writer.writeContentNode("GenerateDebugInformation", {}, "true");
                }

                const optimize = node.optimize;
                if (optimize && optimize !== 'Off') {
                    writer.writeContentNode("EnableCOMDATFolding", {}, "true");
                    writer.writeContentNode("OptimizeReferences", {}, "true");
                }
            });

            const additionalLibs = node.linksStatic || []; // .lib files to link to
            if (additionalLibs.length > 0) {
                writer.writeNode('Lib', {}, (writer) => {
                    additionalLibs.push("$(CoreLibraryDependencies)", "%(AdditionalDependencies)");
                    writer.writeContentNode("AdditionalDependencies", {}, additionalLibs.join(";"));
                });
            }

            const additionalLibDirs = node.libraryDirs || [];
            if (additionalLibDirs.length > 0) {
                writer.writeNode('Lib', {}, (writer) => {
                    writer.writeContentNode("AdditionalLibraryDirectories", {}, additionalLibDirs.join(";"));
                });
            }

            // TODO: Pre-Build, Post-Build, and Post-Link Events
        });
    });
}

function writeFiles(prj: DOMNode, writer: XmlWriter) {
    writer.writeNode("ItemGroup", {}, (writer) => {
        const includes = new Set(prj.getAllNodes().flatMap(node => {
            return (node.inputFiles || []).filter((file: string) => {
                const extension = extname(file);
                return itemTypeExtensionMap.ClInclude.includes(extension);
            });
        }));
        includes.forEach((file: string) => {
            const filters = prj.getChildren().filter(child => child.apiName === 'when');
            const filtersWithoutChild = filters.filter(child => !child.inputFiles.includes(file));
            if (filtersWithoutChild.length === filters.length || filtersWithoutChild.length === 0) {
                writer.writeContentNode("ClInclude", {
                    Include: file
                });
            } else {
                writer.writeNode("ClInclude", { Include: file }, (writer) => {
                    // <ExcludedFromBuild Condition="'$(Configuration)|$(Platform)'=='Debug|Win32'">true</ExcludedFromBuild>
                    filtersWithoutChild.forEach((filter) => {
                        writer.writeContentNode("ExcludedFromBuild", {
                            Condition: `'$(Configuration)|$(Platform)' == '${filter.configuration}|${filter.platform}'`
                        }, "true")
                    });
                });
            }
        });
    });

    writer.writeNode("ItemGroup", {}, (writer) => {
        const sources = new Set(prj.getAllNodes().flatMap(node => {
            return (node.inputFiles || []).filter((file: string) => {
                const extension = extname(file);
                return itemTypeExtensionMap.ClCompile.includes(extension);
            });
        }));
        sources.forEach((file: string) => {
            const filters = prj.getChildren().filter(child => child.apiName === 'when');
            const filtersWithoutChild = filters.filter(child => !child.inputFiles.includes(file));
            if (filtersWithoutChild.length === filters.length || filtersWithoutChild.length === 0) {
                writer.writeContentNode("ClCompile", {
                    Include: file
                });
            } else {
                writer.writeNode("ClCompile", { Include: file }, (writer) => {
                    filtersWithoutChild.forEach((filter) => {
                        writer.writeContentNode("ExcludedFromBuild", {
                            Condition: `'$(Configuration)|$(Platform)' == '${filter.configuration}|${filter.platform}'`
                        }, "true")
                    });
                });
            }
        });
    });
}

function writeProjectReferences(prj: DOMNode, writer: XmlWriter) {
    const deps: DOMNode[] = prj.__deps || [];
    if (deps.length > 0) {
        writer.writeNode("ItemGroup", {}, (writer) => {
            deps.forEach((dep) => {
                const depPath = dep.__fullpath;
                const myPath = dirname(prj.__fullpath);

                const rel = relative(myPath, depPath);
                writer.writeNode("ProjectReference", { Include: rel }, (writer) => {
                    writer.writeContentNode("Project", {}, `{${dep.uuid}}`);
                });
            });
        });
    }
}

function writeProjectTargets(_: DOMNode, writer: XmlWriter) {
    writer.writeContentNode("Import", { Project: "$(VCTargetsPath)\\Microsoft.Cpp.targets" });
}

function writeExtensionTargets(_: DOMNode, writer: XmlWriter) {
    writer.writeNode("ImportGroup", { Label: "ExtensionTargets" }, (_) => { });
}

export function vcxproj(prj: DOMNode) {
    if (prj.apiName !== 'project') {
        throw new Error(`[vstudio] Expected DOMNode of scope project. Received DOMNode of type ${prj.apiName}.`);
    }

    const prjFileLocation = join(prj.location, `${prj.getName()}.vcxproj`);

    const file = new XmlWriter(prjFileLocation);

    file.writeNode("Project", { DefaultTargets: "Build", xmlns: "http://schemas.microsoft.com/developer/msbuild/2003" }, (writer) => {
        writeConfigurationGroups(prj, writer);
        writeGlobalPropertyGroup(prj, writer);
        writeDefaultProps(prj, writer);
        writeConfigurationProps(prj, writer);
        writeProps(prj, writer);
        writePropertySheets(prj, writer);
        writePropertyLinkerConfiguration(prj, writer);
        writeItemDefinitionGroups(prj, writer);
        writeFiles(prj, writer);
        writeProjectReferences(prj, writer);
        writeProjectTargets(prj, writer);
        writeExtensionTargets(prj, writer);
    });

    file.close();
}