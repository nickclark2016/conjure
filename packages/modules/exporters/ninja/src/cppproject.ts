import { CppToolset, DOMNode, ExporterArguments, TextWriter, ToolsetRegistry, findProject, getAllDependencies, pathFromWorkspace, pathTo, pathToWorkspace } from "@conjure/core";
import { join, parse, relative } from "path";
import { Ninja } from "./utilities";

export const languageRule: any = {
    'C': 'cc',
    'C++': 'cxx',
}

function writeHeader(prj: DOMNode, cfg: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    writer.write(`# Generated by Conjure`);
    writer.write(`# Project Build File for ${prj.getName()} - ${cfg.configuration}:${cfg.platform}`);
    writer.write('');
}

function writeRequiredVersion(_prj: DOMNode, _cfg: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    writer.write('ninja_required_version = 1.6');
    writer.write('');
}

function writeCCompileRule(prj: DOMNode, cfg: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    const toolset = (ToolsetRegistry.get().fetch(cfg.toolset) || ToolsetRegistry.get().fetch(prj.toolset)) as CppToolset;
    const defines: string[] = cfg.defines || [];
    const includes: string[] = cfg.includeDirs || [];
    const extIncludes: string[] = cfg.externalIncludeDirs || [];

    const base = (() => {
        try {
            return pathFromWorkspace(cfg);
        } catch (e) {
            return pathFromWorkspace(prj);
        }
    })();

    const cflags = toolset.getCFlags(cfg) || [];
    cflags.push(...toolset.getCppFlags(cfg));
    cflags.push(...defines.map(def => toolset.mapFlag('defines', def)));
    cflags.push(...includes.map(inc => toolset.mapFlag('includeDirs', join(base, inc))));
    cflags.push(...extIncludes.map(inc => toolset.mapFlag('externalIncludeDirs', join(base, inc))));

    const cc = toolset.toolname('compiler', cfg.language);

    writer.write(`CFLAGS = ${cflags.join(' ')}`);
    writer.write('rule cc');
    writer.indent();
    if (toolset.name === 'msc') {
        if (cfg.symbols === 'On') {
            writer.write(`command = ${cc} $CFLAGS /Fd$pdb /nologo /showIncludes -c /Tc$in /Fo:$out`);
        } else {
            writer.write(`command = ${cc} $CFLAGS /nologo /showIncludes -c /Tc$in /Fo:$out`);
        }
        writer.write(`description = cc $out`);
        writer.write(`deps = msvc`);
    } else {
        writer.write(`command = ${cc} $CFLAGS -x c -c -o $out $in`);
        writer.write(`description = cc $out`);
        writer.write(`depfile = $out.d`);
        writer.write(`deps = gcc`);
    }
    writer.outdent();
    writer.write('');
}

function writeCxxCompileRule(prj: DOMNode, cfg: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    const toolset = (ToolsetRegistry.get().fetch(cfg.toolset) || ToolsetRegistry.get().fetch(prj.toolset)) as CppToolset;
    const defines: string[] = cfg.defines || [];
    const includes: string[] = cfg.includeDirs || [];
    const extIncludes: string[] = cfg.externalIncludeDirs || [];

    const base = (() => {
        try {
            return pathFromWorkspace(cfg);
        } catch (e) {
            return pathFromWorkspace(prj);
        }
    })();

    const cxxflags = toolset.getCxxFlags(cfg) || [];
    cxxflags.push(...toolset.getCppFlags(cfg));
    cxxflags.push(...defines.map(def => toolset.mapFlag('defines', def)));
    cxxflags.push(...includes.map(inc => toolset.mapFlag('includeDirs', join(base, inc))));
    cxxflags.push(...extIncludes.map(inc => toolset.mapFlag('externalIncludeDirs', join(base, inc))));

    const cxx = toolset.toolname('compiler', cfg.language);

    writer.write(`CXXFLAGS = ${cxxflags.join(' ')}`);
    writer.write('rule cxx');
    writer.indent();

    if (toolset.name === 'msc') {
        if (cfg.symbols === 'On') {
            writer.write(`command = ${cxx} $CXXFLAGS /Fd$pdb /nologo /showIncludes -c /Tp$in /Fo:$out`);
        } else {
            writer.write(`command = ${cxx} $CXXFLAGS /nologo /showIncludes -c /Tp$in /Fo:$out`);
        }
        writer.write(`description = cxx $out`);
        writer.write(`deps = msvc`);
    } else {
        writer.write(`command = ${cxx} $CXXFLAGS -x c++ -c -MD -MF $out.d -o $out $in`);
        writer.write(`description = cxx $out`);
        writer.write(`depfile = $out.d`);
        writer.write(`deps = gcc`);
    }

    writer.outdent();
    writer.write('');
}

function writeLinkCompileRule(prj: DOMNode, cfg: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    const toolset = (ToolsetRegistry.get().fetch(cfg.toolset) || ToolsetRegistry.get().fetch(prj.toolset)) as CppToolset;

    const isArchive = cfg.kind === 'StaticLib';

    const linker = toolset.toolname(isArchive ? 'archive' : 'compiler', cfg.language);
    const links: string[] = [];

    const base = (() => {
        try {
            return pathFromWorkspace(cfg);
        } catch (e) {
            return pathFromWorkspace(prj);
        }
    })();

    cfg.libraryDirs = (cfg.libraryDirs || []).map((dir: string) => {
        return join(base, dir);
    });

    const projectDeps: DOMNode[] = getAllDependencies(prj);
    projectDeps.forEach(depPrj => {
        if (depPrj) {
            const depTargetCfg = depPrj.getChildren().find(flt => flt.platform === cfg.platform && flt.configuration === cfg.configuration);
            if (depTargetCfg) {
                const getBase = ((node: DOMNode) => {
                    try {
                        return pathFromWorkspace(node);
                    } catch (e) {
                        const parent = node.getParent();
                        if (parent) {
                            return pathFromWorkspace(parent);
                        }
                        throw e;
                    }
                });

                const base = getBase(depTargetCfg);

                const targetName = `${depPrj.getName()}${toolset.mapFlag('targetExtension', depPrj.kind)}`;
                const toLibFromDep = join(base, depTargetCfg.targetDirectory);

                if (depPrj.kind === 'StaticLib') {
                    cfg.libraryDirs.push(toLibFromDep);
                    links.push(`${toolset.mapFlag('linksStatic', targetName)}`);
                } else if (depPrj.kind === 'SharedLib' && prj.kind === 'ConsoleApp') {
                    // todo: handle dynamic linkage
                    cfg.libraryDirs.push(toLibFromDep);
                    if (toolset.name === 'clang') {
                        const relative_path = relative(join(getBase(cfg), cfg.targetDirectory), join(getBase(depTargetCfg), depTargetCfg.targetDirectory));
                        if (relative_path !== '' && relative_path !== '.') {
                            links.push(`-Wl,-rpath,'$$ORIGIN'/${relative_path}`);
                        } else {
                            links.push(`-Wl,-rpath,'$$ORIGIN'`);
                        }
                    }
                    links.push(`${toolset.mapFlag('linksStatic', targetName)}`);
                }
            }
        }
    });

    links.push(...(cfg.linksStatic || []).map((lib: string) => toolset.mapFlag('linksStatic', lib)));

    cfg.libraryDirs = [...new Set(cfg.libraryDirs)];

    const linkFlags = toolset.getLinkFlags(cfg) || [];

    writer.write(`LINKFLAGS = ${linkFlags.join(' ').trim()}`);
    writer.write('rule link');
    writer.indent();

    if (toolset.name === 'msc') {
        if (isArchive) {
            writer.write(`command = ${linker} $in /nologo $LINKFLAGS -OUT:$out`);
            writer.write(`description = ar $out`);
        } else {
            if (cfg.symbols === 'On') {
                writer.write(`command = ${linker} $in /link $LINKFLAGS ${links.join(' ').trim()} /nologo /out:$out /PDB:$pdb`);
            } else {
                writer.write(`command = ${linker} $in /link $LINKFLAGS ${links.join(' ').trim()} /nologo /out:$out`);
            }
            writer.write(`description = link $out`);
        }
    } else {
        if (isArchive) {
            writer.write(`command = ${linker} rcs $out $in`);
            writer.write(`description = ar $out`);
        } else {
            writer.write(`command = ${linker} -o $out $in $LINKFLAGS ${links.join(' ').trim()}`);
            writer.write(`description = link $out`);
        }
    }

    writer.outdent();
    writer.write('');
}

function writePreBuildRule(prj: DOMNode, cfg: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    const events = cfg.preBuildEvents || [];
    if (events.length === 0) {
        return;
    }

    writer.write(`rule prebuild_${prj.getName()}_${cfg.configuration}_${cfg.platform}`);
    writer.indent();
    writer.write(`command = ${events.join(' && ')}`);
    writer.outdent();
    writer.write('');

    writer.write(`build prebuild_${prj.getName()}_${cfg.configuration}_${cfg.platform}: prebuild_${prj.getName()}_${cfg.configuration}_${cfg.platform}`);
    writer.write('');
}

function writePreLinkRule(prj: DOMNode, cfg: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    const events = cfg.preLinkEvents || [];
    if (events.length === 0) {
        return;
    }

    writer.write(`rule prelink_${prj.getName()}_${cfg.configuration}_${cfg.platform}`);
    writer.indent();
    writer.write(`command = ${events.join(' && ')}`);
    writer.outdent();
    writer.write('');

    writer.write(`build prelink_${prj.getName()}_${cfg.configuration}_${cfg.platform}: prelink_${prj.getName()}_${cfg.configuration}_${cfg.platform}`);
    writer.write('');
}

function writePostBuildRule(prj: DOMNode, cfg: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    const events = cfg.postBuildEvents || [];
    if (events.length === 0) {
        return;
    }

    writer.write(`rule postbuild_${prj.getName()}_${cfg.configuration}_${cfg.platform}`);
    writer.indent();
    writer.write(`command = ${events.join(' && ')}`);
    writer.outdent();
    writer.write('');

    const base = (() => {
        try {
            return pathFromWorkspace(cfg);
        } catch (e) {
            return pathFromWorkspace(prj);
        }
    })();

    const toolset = (ToolsetRegistry.get().fetch(cfg.toolset) || ToolsetRegistry.get().fetch(prj.toolset)) as CppToolset;

    const targetDir = cfg.targetDirectory ? join(base, cfg.targetDirectory) : join(base, `bin`, cfg.platform, cfg.configuration);
    const targetPath = join(targetDir, `${prj.getName()}${toolset.mapFlag('targetExtension', cfg.kind)}`);

    writer.write(`build postbuild_${prj.getName()}_${cfg.configuration}_${cfg.platform}: postbuild_${prj.getName()}_${cfg.configuration}_${cfg.platform} | ${targetPath}`);
    writer.write('');
}

function writeFiles(prj: DOMNode, cfg: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    const toolset = (ToolsetRegistry.get().fetch(cfg.toolset) || ToolsetRegistry.get().fetch(prj.toolset)) as CppToolset;
    const intDir: string = cfg.intermediateDirectory || join(`obj`, cfg.platform, cfg.configuration);

    const files = [...(prj.inputFiles || []), ...(cfg.inputFiles || [])];
    const base = (() => {
        try {
            return pathFromWorkspace(cfg);
        } catch (e) {
            return pathFromWorkspace(prj);
        }
    })();

    const targetDir = join(base, intDir);
    const pdbPath = join(targetDir, `${prj.getName()}.pdb`);
    const preBuildEvents = cfg.preBuildEvents || [];

    writer.indent();
    writer.outdent();

    files.forEach(file => {
        const language = Ninja.determineLanguage(file);
        if (language) {
            const rule = languageRule[language];
            if (rule) {
                const intermediate = `${parse(file).name}${toolset.mapFlag('intermediateExtension', '')}`;
                const path = join(base, intDir, intermediate);
                const fullPath = join(base, file);

                if (preBuildEvents.length > 0) {
                    writer.write(`build ${path}: ${rule} ${fullPath} | prebuild_${prj.getName()}_${cfg.configuration}_${cfg.platform}`);
                } else {
                    writer.write(`build ${path}: ${rule} ${fullPath}`);
                }
                if (cfg.symbols === 'On') {
                    writer.indent();
                    writer.write(`pdb = ${pdbPath}`);
                    writer.outdent();
                }
            } else {
                console.warn(`Failed to find rule for language: ${language}`);
            }
        }
    });
    writer.write('');
}

function writeOutputs(prj: DOMNode, cfg: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    const toolset = (ToolsetRegistry.get().fetch(cfg.toolset) || ToolsetRegistry.get().fetch(prj.toolset)) as CppToolset;
    const intDir: string = cfg.intermediateDirectory || join(`obj`, cfg.platform, cfg.configuration);

    writer.write(`# Link ${prj.getName()}`);

    const base = (() => {
        try {
            return pathFromWorkspace(cfg);
        } catch (e) {
            return pathFromWorkspace(prj);
        }
    })();

    const files = [...(prj.inputFiles || []), ...(cfg.inputFiles || [])];
    const ints = new Set(files.filter(file => Ninja.determineLanguage(file) !== undefined).map(file => {
        const intermediate = `${parse(file).name}${toolset.mapFlag('intermediateExtension', '')}`;
        const path = join(base, intDir, intermediate);
        return path;
    }));

    const targetDir = cfg.targetDirectory ? join(base, cfg.targetDirectory) : prj.targetDirectory ? join(base, prj.targetDirectory) : join(base, `bin`, cfg.platform, cfg.configuration);
    const targetPath = join(targetDir, `${prj.getName()}${toolset.mapFlag('targetExtension', cfg.kind)}`);

    const deps = getAllDependencies(prj).map(depPrj => {
        if (depPrj) {
            const depTargetCfg = depPrj.getChildren().find(flt => flt.platform === cfg.platform && flt.configuration === cfg.configuration);
            if (depTargetCfg) {
                const base = (() => {
                    try {
                        return pathFromWorkspace(depTargetCfg);
                    } catch (e) {
                        return pathFromWorkspace(depPrj);
                    }
                })();

                const toLibFromDep = join(base, depTargetCfg.targetDirectory);
                const targetName = `${depPrj.getName()}${toolset.mapFlag('targetExtension', depPrj.kind)}`;
                if (depPrj.kind === 'StaticLib' || depPrj.kind === 'SharedLib') {
                    return join(toLibFromDep, targetName);
                }
            }
        }
    });

    if ((cfg.preLinkEvents || []).length > 0) {
        deps.push(`prelink_${prj.getName()}_${cfg.configuration}_${cfg.platform}`);
    }

    const depString = deps.length > 0 ? `| ${deps.join(' ')}` : ''

    writer.write(`build ${targetPath}: link ${[...ints].join(' ')} ${depString}`);
    if (cfg.symbols === 'On' && toolset.name === 'msc') {
        const pdbPath = join(targetDir, `${prj.getName()}.pdb`);
        writer.indent();
        writer.write(`pdb = ${pdbPath}`);
        writer.outdent();
    }
    writer.write('');
}

function writePhonies(prj: DOMNode, cfg: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    const toolset = (ToolsetRegistry.get().fetch(cfg.toolset) || ToolsetRegistry.get().fetch(prj.toolset)) as CppToolset;

    writer.write(`# Build Phonies`);

    const base = (() => {
        try {
            return pathFromWorkspace(cfg);
        } catch (e) {
            return pathFromWorkspace(prj);
        }
    })();

    // Depends on the post-link step
    if ((cfg.postBuildEvents || []).length > 0) {
        writer.write(`build ${prj.getName()}_${cfg.configuration}_${cfg.platform}: phony postbuild_${prj.getName()}_${cfg.configuration}_${cfg.platform}`);
    } else {
        const targetDir = cfg.targetDirectory ? join(base, cfg.targetDirectory) : join(base, `bin`, cfg.platform, cfg.configuration);
        const targetPath = join(targetDir, `${prj.getName()}${toolset.mapFlag('targetExtension', cfg.kind)}`);
    
        writer.write(`build ${prj.getName()}_${cfg.configuration}_${cfg.platform}: phony ${targetPath}`);
    }

    writer.write('');
}

export type PerProjectConfig = (prj: DOMNode, cfg: DOMNode, args: ExporterArguments, writer: TextWriter) => void;

export const perProjectConfigFunctions: PerProjectConfig[] = [
    writeHeader,
    writeRequiredVersion,
    writeCCompileRule,
    writeCxxCompileRule,
    writeLinkCompileRule,
    writePreBuildRule,
    writePreLinkRule,
    writeFiles,
    writeOutputs,
    writePostBuildRule,
    writePhonies,
];

export function cppProject(prj: DOMNode, args: ExporterArguments) {
    const filters = prj.getChildren().filter(flt => flt.apiName === 'when');
    filters.forEach(flt => {
        const config = flt.configuration;
        const platform = flt.platform;

        const path = join(prj.location, `${prj.getName()}_${config}_${platform}.ninja`);
        const writer = new TextWriter(path);
        writer.useSpaceIndent(2);

        perProjectConfigFunctions.forEach(fn => fn(prj, flt, args, writer));

        writer.close();
    });
}