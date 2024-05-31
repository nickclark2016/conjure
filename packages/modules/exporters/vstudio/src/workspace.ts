import { DOMNode, ExporterArguments, TextWriter } from "@conjure/core";
import { join, normalize, relative, resolve } from "path";
import { v4 as uuidV4 } from "uuid";
import { vcxproj } from "./vcxproj";
import { vcxprojuser } from "./vcxprojuser";

// Found at: https://www.codeproject.com/Reference/720512/List-of-Visual-Studio-Project-Type-GUIDs
const projectTypeGuid: any = {
    'C#': 'FAE04EC0-301F-11D3-BF4B-00C04F79EFBC',
    'C++': '8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942',
    'Solution Folder': '2150E333-8FDC-42A3-9474-1A3956D46DE8'
};

const vstudioVersionMapper: any = {
    '2017': '15',
    '2019': '16',
    '2022': '17',
    'default': '17'
};

const projectExporterMapper: any = {
    'C': vcxproj,
    'C++': vcxproj
};

const projectUserExporterMapper: any = {
    'C': vcxprojuser,
    'C++': vcxprojuser
};

function applyUuids(nodes: DOMNode[]) {
    nodes.forEach((node) => {
        node.uuid = uuidV4();
    });
}

function applyDependencies(nodes: DOMNode[]) {
    nodes.forEach(node => {
        const deps: string[] = node.dependsOn || [];
        if (deps.length === 0) {
            return;
        }
        node.__deps = [];
        deps.forEach((depName) => {
            const dependentNode = nodes.find(n => n.getName() === depName);
            if (!dependentNode) {
                throw new Error(`Cannot locate dependency with name ${depName}.`);
            }
            node.__deps.push(dependentNode);
        });
    });
}

function writeHeader(args: ExporterArguments, file: TextWriter) {
    file.write(`Microsoft Visual Studio Solution File, Format Version 12.00`)
    file.write(`# Visual Studio Version ${vstudioVersionMapper[args.version] || vstudioVersionMapper["default"]}`);
}

function writeProjectOrGroup(wks: DOMNode, node: DOMNode, args: ExporterArguments, file: TextWriter) {
    const extractProjectType = (node: DOMNode): string => {
        if (node.apiName === 'project') {
            if (!node.language) {
                throw new Error(`[vstudio] Language for project ${node.getName()} not defined.`);
            }
            return projectTypeGuid[node.language];
        } else if (node.apiName === 'group') {
            return projectTypeGuid['Solution Folder'];
        } else {
            throw new Error(`[vstudio] Failed to get project type for API node ${node.apiName}.`);
        }
    };

    const writeDependencies = (node: DOMNode): void => {
        const dependencies: DOMNode[] = node.__deps || [];
        if (dependencies.length > 0) {
            file.indent();
            file.write(`ProjectSection(ProjectDependencies) = postProject`);
            file.indent();
            dependencies.forEach((dependsOnProject: DOMNode) => {
                file.write(`{${dependsOnProject.uuid}} = {${dependsOnProject.uuid}}`)
            });
            file.outdent();
            file.write(`EndProjectSection`);
            file.outdent();
        }
    };

    const name = node.getName();

    if (node.apiName === 'project') {
        const location = normalize(join(node.location, `${name}.vcxproj`));
        const path = relative(wks.location, location);
        node.__fullpath = resolve(path);
        node.__wks = wks;
        file.write(`Project("{${extractProjectType(node)}}") = "${name}", "${path}", "{${node.uuid}}"`);
    } else if (node.apiName === 'group') {
        file.write(`Project("{${extractProjectType(node)}}") = "${name}", "${name}", "{${node.uuid}}"`);
    }

    writeDependencies(node);
    file.write(`EndProject`);
}

function writeGlobal(sln: DOMNode, prjs: DOMNode[], groups: DOMNode[], _args: ExporterArguments, file: TextWriter) {
    file.write(`Global`);

    file.indent();
    file.write(`GlobalSection(SolutionConfigurationPlatforms) = preSolution`);

    const configs: string[] = sln.configurations;
    const platforms: string[] = sln.platforms;

    file.indent();
    configs.forEach((config) => platforms.forEach((platform) => file.write(`${config}|${platform} = ${config}|${platform}`)));
    file.outdent();

    file.write(`EndGlobalSection`);

    file.write(`GlobalSection(ProjectConfigurationPlatforms) = postSolution`)

    file.indent();
    prjs.forEach((prj) => {
        configs.forEach((config) => platforms.forEach((platform) => {
            file.write(`{${prj.uuid}}.${config}|${platform}.ActiveCfg = ${config}|${platform}`);
            file.write(`{${prj.uuid}}.${config}|${platform}.Build.0 = ${config}|${platform}`);
        }));
    });
    file.outdent();

    file.write(`EndGlobalSection`);

    file.write('GlobalSection(SolutionProperties) = preSolution');

    file.indent();
    file.write('HideSolutionNode = FALSE');
    file.outdent();
    
    file.write('EndGlobalSection');

    // Write nested projects
    if (groups.length > 0) {
        file.write('GlobalSection(NestedProjects) = preSolution');

        file.indent();
        prjs.forEach((prj: DOMNode) => {
            const parent = prj.getParent();
            if (!parent) {
                throw new Error(`Failed to fetch parent group.`);
            }

            if (parent.apiName === 'group') {
                file.write(`{${prj.uuid}} = {${parent.uuid}}`);
            }
        })
        file.outdent();

        file.write('EndGlobalSection');
    }

    file.outdent();
    file.write(`EndGlobal`);
}

export function workspace(wks: DOMNode, args: ExporterArguments) {
    if (wks.apiName !== 'workspace') {
        throw new Error(`[vstudio] Expected DOMNode of scope workspace. Received DOMNode of type ${wks.apiName}.`);
    }

    const wksFileLocation = join(wks.location, `${wks.getName()}.sln`);
    const file = new TextWriter(wksFileLocation);

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
    const groups = groupsAndProjects.filter(node => node.apiName === 'group');
    const projects = groupsAndProjects.filter(node => node.apiName === 'project');

    applyUuids(groupsAndProjects);
    applyDependencies(projects);

    writeHeader(args, file);
    groupsAndProjects.forEach((n) => writeProjectOrGroup(wks, n, args, file));
    writeGlobal(wks, projects, groups, args, file);

    file.close();

    projects.forEach((prj) => {
        const exporter = projectExporterMapper[prj.language];
        exporter(prj, args);

        const userExporter = projectUserExporterMapper[prj.language];
        userExporter(prj, args);
    });
}