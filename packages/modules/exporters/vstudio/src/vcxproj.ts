import { DOMNode, ExporterArguments, XmlWriter, pathToWorkspace } from "@conjure/core";
import { dirname, extname, join, relative } from "path";
import { vs2022 } from "./vs2022";

const versions: any = {
    '2022': vs2022,
    default: vs2022,
}

const defaults: any = {
    vs2022
}

function writeConfigurationGroups(prj: DOMNode, _version: any, writer: XmlWriter) {
    writer.writeNode("ItemGroup", { Label: "ProjectConfigurations" }, (writer: XmlWriter) => {
        prj.getChildren().filter((node) => node.apiName === 'when').forEach((node) => {
            writer.writeNode("ProjectConfiguration", { Include: `${node.configuration}|${node.platform}` }, (writer) => {
                writer.writeContentNode("Configuration", {}, node.configuration);
                writer.writeContentNode("Platform", {}, node.platform);
            });
        });
    });
}

function writeGlobalPropertyGroup(prj: DOMNode, _version: any, writer: XmlWriter) {
    writer.writeNode("PropertyGroup", { Label: "Globals" }, (writer: XmlWriter) => {
        writer.writeContentNode("ProjectGuid", {}, `{${prj.uuid}}`);
        writer.writeContentNode("IgnoreWarningCompileDuplicatedFilename", {}, "true");
        writer.writeContentNode("Keyword", {}, "Win32Proj"); // Do I need to fetch this from somewhere?
        writer.writeContentNode("RootNamespace", {}, prj.getName());
    });
}

function writeDefaultProps(_: DOMNode, _version: any, writer: XmlWriter) {
    writer.writeContentNode("Import", { Project: "$(VCTargetsPath)\\Microsoft.Cpp.Default.props" });
}

function writeProps(_: DOMNode, _version: any, writer: XmlWriter) {
    writer.writeContentNode("Import", { Project: "$(VCTargetsPath)\\Microsoft.Cpp.props" });
    writer.writeNode("ImportGroup", { Label: "ExtensionSettings" }, (_) => { });
}

function writeConfigurationProps(prj: DOMNode, version: any, writer: XmlWriter) {
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
            let toolsetName = version.vcxproj.toolsets[node.toolset] || version.vcxproj.defaults.toolset;

            writer.writeContentNode("ConfigurationType", {}, version.vcxproj.kind[node.kind].Name);
            writer.writeContentNode("UseDebugLibraries", {}, `${useDebugLibs(node)}`);
            writer.writeContentNode("CharacterSet", {}, "Unicode");
            writer.writeContentNode("PlatformToolset", {}, toolsetName);
        });
    });
}

function writePropertySheets(prj: DOMNode, _version: any, writer: XmlWriter) {
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

function writePropertyLinkerConfiguration(prj: DOMNode, version: any, writer: XmlWriter) {
    prj.getChildren().filter((node) => node.apiName === 'when').forEach((node) => {
        const linkIncremental = node.configuration === 'Debug';
        const intDir: string = node.intermediateDirectory || 'obj';
        const binDir: string = node.targetDirectory || 'bin';
        const targetName = node.targetName || prj.getName();
        const targetExt = node.targetExt || version.vcxproj.kind[node.kind].Extension;

        writer.writeNode("PropertyGroup", {
            Condition: `'$(Configuration)|$(Platform)'=='${node.configuration}|${node.platform}'`
        }, (writer) => {
            writer.writeContentNode("LinkIncremental", {}, `${linkIncremental}`);
            writer.writeContentNode("OutDir", {}, `${binDir}\\`);
            writer.writeContentNode("IntDir", {}, `${intDir}\\`);
            writer.writeContentNode("TargetName", {}, targetName);
            writer.writeContentNode("TargetExt", {}, targetExt);

            const externalIncludes: string[] = node.externalIncludeDirs || [];
            if (externalIncludes.length > 0) {
                writer.writeContentNode(version.vcxproj.externalIncludesSupported ? "ExternalIncludePath" : "IncludePath", {}, externalIncludes.join(";"));
            }
        });
    });
}

function writeItemDefinitionGroups(prj: DOMNode, version: any, writer: XmlWriter) {
    prj.getChildren().filter((node) => node.apiName === 'when').forEach((node) => {
        writer.writeNode("ItemDefinitionGroup", {
            Condition: `'$(Configuration)|$(Platform)'=='${node.configuration}|${node.platform}'`
        }, (writer) => {
            writer.writeNode("ClCompile", {}, (writer) => {
                writer.writeContentNode("PrecompiledHeader", {}, "NotUsing"); // TODO: Search for PCH

                const warningLevel = node.warnings || 'Default';
                writer.writeContentNode("WarningLevel", {}, version.vcxproj.warningLevel[warningLevel]);

                const defines: string[] = node.defines || [];
                defines.push("%(PreprocessorDefinitions)");
                writer.writeContentNode("PreprocessorDefinitions", {}, defines.join(";"));

                const includes: string[] = node.includeDirs || [];
                includes.push("%(AdditionalIncludeDirectories)");
                writer.writeContentNode("AdditionalIncludeDirectories", {}, includes.join(";"));

                const symbols = node.symbols;
                if (symbols && symbols !== 'Off') {
                    writer.writeContentNode("DebugInformationFormat", {}, "EditAndContinue");
                }

                const optimize = node.optimize;
                if (optimize) {
                    const flag = version.vcxproj.optimizations[optimize];
                    writer.writeContentNode("Optimization", {}, flag);
                }

                if (optimize && optimize !== 'Off') {
                    writer.writeContentNode("FunctionLevelLinking", {}, "true");
                    writer.writeContentNode("IntrinsicFunctions", {}, "true");
                    writer.writeContentNode("StringPooling", {}, "true");
                }

                const staticRt = node.staticRuntime || 'Off';
                const runtime = node.runtime || 'Release';
                writer.writeContentNode("RuntimeLibrary", {}, version.vcxproj.runtimes[runtime][staticRt]);

                writer.writeContentNode("MultiProcessorCompilation", {}, "true");
                const langVersion = prj.languageVersion;
                if (prj.language === 'C++') {
                    writer.writeContentNode("LanguageStandard", {}, version.vcxproj.versions['C++'][langVersion || defaults.vs2022.vcxproj.defaults.cppversion]);
                } else if (prj.language === 'C') {
                    writer.writeContentNode("LanguageStandard_C", {}, version.vcxproj.versions['C'][langVersion || defaults.vs2022.vcxproj.defaults.cversion]);
                } else {
                    throw new Error(`Unsupported language: ${prj.language}`);
                }

                const externalWarningLevel = node.externalWarnings || 'Default';
                writer.writeContentNode("ExternalWarningLevel", {}, version.vcxproj.warningLevel[externalWarningLevel]);
            });

            writer.writeNode("Link", {}, (writer) => {
                writer.writeContentNode("SubSystem", {}, version.vcxproj.kind[node.kind].Subsystem);

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

            // Escape sequence for &&
            const compoundAndEscape = "&amp;&amp;"
            const pathToWks = pathToWorkspace(prj);

            const additionalLibDirs = node.libraryDirs || [];
            if (additionalLibDirs.length > 0) {
                writer.writeNode('Lib', {}, (writer) => {
                    writer.writeContentNode("AdditionalLibraryDirectories", {}, additionalLibDirs.join(";"));
                });
            }

            const preBuildEvents = node.preBuildEvents || [];
            if (preBuildEvents.length > 0) {
                writer.writeNode('PreBuildEvent', {}, (writer) => {
                    writer.writeContentNode("Command", {}, [`cd ${pathToWks}`, ...preBuildEvents].join(` ${compoundAndEscape} `));
                });
            }

            const preLinkEvents = node.preLinkEvents || [];
            if (preLinkEvents.length > 0) {
                writer.writeNode('PreLinkEvent', {}, (writer) => {
                    writer.writeContentNode("Command", {}, [`cd ${pathToWks}`, ...preLinkEvents].join(` ${compoundAndEscape} `));
                });
            }

            const postBuildEvents = node.postBuildEvents || [];
            if (postBuildEvents.length > 0) {
                writer.writeNode('PostBuildEvent', {}, (writer) => {
                    writer.writeContentNode("Command", {}, [`cd ${pathToWks}`, ...postBuildEvents].join(` ${compoundAndEscape} `));
                });
            }
        });
    });
}

function writeFiles(prj: DOMNode, version: any, writer: XmlWriter) {
    writer.writeNode("ItemGroup", {}, (writer) => {
        const includes = new Set(prj.getAllNodes().flatMap(node => {
            return (node.inputFiles || []).filter((file: string) => {
                const extension = extname(file);
                return version.vcxproj.extensions.Headers.includes(extension);
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
                return version.vcxproj.extensions.Compiled.includes(extension);
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

function writeProjectReferences(prj: DOMNode, _version: any, writer: XmlWriter) {
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

function writeProjectTargets(_: DOMNode, _version: any, writer: XmlWriter) {
    writer.writeContentNode("Import", { Project: "$(VCTargetsPath)\\Microsoft.Cpp.targets" });
}

function writeExtensionTargets(_: DOMNode, _version: any, writer: XmlWriter) {
    writer.writeNode("ImportGroup", { Label: "ExtensionTargets" }, (_) => { });
}

type VcxProjFunc = (prj: DOMNode, version: any, writer: XmlWriter) => void;

export const functionArray: Array<VcxProjFunc> = [
    writeConfigurationGroups,
    writeGlobalPropertyGroup,
    writeDefaultProps,
    writeConfigurationProps,
    writeProps,
    writePropertySheets,
    writePropertyLinkerConfiguration,
    writeItemDefinitionGroups,
    writeFiles,
    writeProjectReferences,
    writeProjectTargets,
    writeExtensionTargets,
];

export function vcxproj(prj: DOMNode, args: ExporterArguments) {
    if (prj.apiName !== 'project') {
        throw new Error(`[vstudio] Expected DOMNode of scope project. Received DOMNode of type ${prj.apiName}.`);
    }

    const prjFileLocation = join(prj.location, `${prj.getName()}.vcxproj`);

    const file = new XmlWriter(prjFileLocation);
    const version = versions[args.version] || versions.default;

    file.writeNode("Project", { DefaultTargets: "Build", xmlns: "http://schemas.microsoft.com/developer/msbuild/2003" }, (writer) => {
        functionArray.forEach(fn => fn(prj, version, writer));
    });

    file.close();
}