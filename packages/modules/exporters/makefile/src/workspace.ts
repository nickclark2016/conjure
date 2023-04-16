import { DOMNode, ExporterArguments, TextWriter } from "@conjure/core";
import { dirname, join, relative } from "path";
import { cppProject } from "./cppproject";
import { fetchConfigNames, makeEscape, writeShell } from "./utils";

const projectMap: any = {
    'C++': cppProject
}

function writeHeader(wks: DOMNode, file: TextWriter) {
    file.write(`# Makefile generated by Conjure for workspace ${wks.getName()}`);
    file.write("");
}

function writeDefaults(wks: DOMNode, file: TextWriter) {
    const defaultConfig = fetchConfigNames(wks)[0];
    file.write(`ifndef config`);
    file.indent();
    file.write(`config=${defaultConfig}`);
    file.outdent();
    file.write('endif');
    file.write("");
}

function writeHelp(wks: DOMNode, file: TextWriter) {
    file.write("# Help Rule")
    file.write('help:');
    file.indent();
    file.write('@echo "Usage: make [config=name] [target]"');

    // write configs
    file.write('@echo ""');
    file.write('@echo "Configurations:"');
    fetchConfigNames(wks).forEach(name => {
        file.write(`@echo "  ${name}"`);
    });

    // write targets
    file.write('@echo ""');
    file.write('@echo "Targets:"');
    file.write('@echo "  all (default target)"');
    file.write('@echo "  clean"');

    wks.getAllNodes().filter(n => n !== wks && (n.apiName === 'project' || n.apiName === 'group')).forEach(n => {
        file.write(`@echo "  ${makeEscape(n.getName())}"`);
    });

    file.outdent();
    file.write("");
}

function writeProjetsAndGroups(wks: DOMNode, file: TextWriter) {
    file.write('# Projects and Group Lists')
    const projects = wks.getAllNodes().filter(n => n.apiName === 'project');
    const groups = wks.getAllNodes().filter(n => n.apiName === 'group');

    const projectString = projects.map(p => makeEscape(p.getName())).join(' ');
    const groupString = groups.map(g => makeEscape(g.getName())).join(' ');

    file.write(`PROJECTS := ${projectString}`);
    file.write(`GROUPS := ${groupString}`);
    file.write("");
}

function writePhonies(_: DOMNode, file: TextWriter) {
    file.write("# Phony rules")
    file.write('.PHONY: all clean help $(PROJECTS) $(GROUPS)');
    file.write("");
    file.write('all: $(PROJECTS)');
    file.write("");
}

function writeGroupRules(wks: DOMNode, file: TextWriter) {
    file.write(`# Group Rules`)
    wks.getAllNodes().filter(n => n.apiName === 'group').forEach(n => {
        file.write(`${makeEscape(n.getName())}: ${n.getChildren()
            .filter(desc => desc.apiName === 'project' || desc.apiName === 'group')
            .map(desc => makeEscape(desc.getName()))
            .join(' ')}`);
        file.indent();
        file.write(`\t@echo "==== Building Group ${n.getName()} - ($(config)) ===="`)
        file.outdent();
        file.write("");
    });
}

function writeProjectRules(wks: DOMNode, file: TextWriter) {
    file.write(`# Project Rules`)
    wks.getAllNodes().filter(n => n.apiName === 'project').forEach(n => {
        const deps = n.dependsOn || [];

        const abspath = join(n.location, n.__makefile_name);
        const relpath = relative(wks.location, abspath);
        const prjdir = makeEscape(dirname(relpath));
        const prjfile = n.__makefile_name;

        if (deps.length == 0) {
            file.write(`${makeEscape(n.getName())}:`);
        } else {
            file.write(`${makeEscape(n.getName())}: ${deps.map((d: string) => makeEscape(d)).join(' ')}`);
        }
        file.indent();
        file.write(`\t@echo "==== Building ${n.getName()} - ($(config)) ===="`);
        file.write(`\t@\${MAKE} --no-print-directory -C ${prjdir} -f ${prjfile} config=$(config)`);
        file.outdent();
        file.write("");
    });
}

export function workspace(wks: DOMNode, args: ExporterArguments) {
    if (wks.apiName !== 'workspace') {
        throw new Error(`[vstudio] Expected DOMNode of scope workspace. Received DOMNode of type ${wks.apiName}.`);
    }

    const fetchAllProjectsAndGroups = (node: DOMNode): DOMNode[] => {
        if (node.apiName === 'project') {
            return [node];
        } else if (node.apiName === 'group' || node.apiName === 'workspace') {
            const children: DOMNode[] = node.getChildren().filter((n) => n.apiName === 'project' || n.apiName === 'group').flatMap((n) => fetchAllProjectsAndGroups(n));
            return [node, ...children];
        }
        return [];
    }

    const groupsAndProjects = fetchAllProjectsAndGroups(wks);

    const wksFileLocation = join(wks.location, wks.__makefile_name);
    wks.__fileLocation = wksFileLocation;

    const file = new TextWriter(wksFileLocation);

    writeHeader(wks, file);
    writeDefaults(wks, file);
    writeShell(wks, file);
    writeProjetsAndGroups(wks, file);
    writePhonies(wks, file);
    writeGroupRules(wks, file);
    writeProjectRules(wks, file);
    writeHelp(wks, file);

    file.close();

    groupsAndProjects.forEach((node) => {
        if (node.apiName === 'project') {
            projectMap[node.language](node, args);
        }
    });
}