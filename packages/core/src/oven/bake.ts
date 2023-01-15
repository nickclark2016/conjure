import { DOMNode } from "../dom";
import { APIBehaviorOnAccept, FieldRegistry } from "../fields";
import { glob } from "glob";
import { join, normalize } from "path";
import { State } from "../state";
import { Filter, filterMatch } from "../scope";

function bakeLocation(wks: DOMNode) {
    const scriptLocation = wks.scriptLocation;
    const scriptDirectory = scriptLocation;
    const location = scriptDirectory;
    if (wks.location) {
        wks.location = normalize(join(location, wks.location));
    } else {
        wks.location = location;
    }
}

function bakeInheritedProperties(node: DOMNode) {
    const parentProperties = node.getParent();
    if (parentProperties === null) {
        throw new Error(`Cannot bake properties from parentless node.`);
    }
    const fieldRegistry = FieldRegistry.get();
    const registeredProperties = Object.entries(parentProperties).map(([name, value]: [string, any]) => {
        return {
            name: name,
            field: fieldRegistry.fetch(name),
            value: value
        };
    }).filter((obj) => obj.field !== null && obj.value !== null && obj.field.isInheritable());

    registeredProperties.forEach((prop) => {
        const name = prop.name;
        const existing: any[] = node[name] || [];
        if (prop.field?.behaviorOnAccept() === APIBehaviorOnAccept.Merge) {
            // merge, don't replace
            node[name] = prop.field?.acceptedTypes().merge(existing, prop.value);
        } else if (prop.field?.behaviorOnAccept() === APIBehaviorOnAccept.Replace) {
            node[name] = prop.value;
        }
    });
}

function cartesianProduct(sets: string[][]): string[][] {
    return sets.reduce<string[][]>(
        (results, ids) =>
            results
                .map(result => ids.map(id => [...result, id]))
                .reduce((nested, result) => [...nested, ...result]),
        [[]]
    );
}

function bakeFiles(node: DOMNode) {
    const filePatterns: string[] = node.files || [];
    const filesFound: string[] = [];

    filePatterns.forEach((pattern) => {
        const matches = glob.sync(pattern, { cwd: node.location }).map((file) => {
            return normalize(file);
        });
        filesFound.push(...matches);
    });
    node.inputFiles = filesFound;
}

function bakeConfigurationTuples(prj: DOMNode) {
    const configurations: string[] | undefined = prj.configurations;
    const platforms: string[] | undefined = prj.platforms;

    if (!configurations || !platforms) {
        throw new Error(`Failed to find configurations and/or platforms for project ${prj.getName()}.`);
    }

    const cartesian = cartesianProduct([configurations, platforms]);

    const createNode = (configuration: string, platform: string): DOMNode => {
        const node = new DOMNode(`filter_${configuration}_${platform}`);
        node.apiName = 'when';
        node.configuration = configuration;
        node.platform = platform;

        return node;
    };

    cartesian.forEach(([configuration, platform]: string[]) => {
        const node = createNode(configuration, platform);
        
        prj.addChild(node);
        const filters: Filter[] = prj.filters || [];
        filters.filter((filter: Filter) => {
            return filterMatch(filter, {
                platform,
                configuration
            });
        }).forEach((filter: Filter) => {
            filter.callback({
                platform,
                configuration
            });

            const rt = node.runtime;
            if (!rt) {
                if (configuration === 'Debug') {
                    node.runtime = 'Debug';
                } else if (configuration === 'Release') {
                    node.runtime = 'Release';
                }
            }
        });

        // bakeLocation(node);
        bakeInheritedProperties(node);
        // bakeFiles(node);
    });
}

function bakeWorkspace(wks: DOMNode) {
    bakeLocation(wks);
}

function bakeGroup(grp: DOMNode) {
    bakeLocation(grp);
    bakeInheritedProperties(grp);
    bakeConfigurationTuples(grp);
}

function bakeProject(prj: DOMNode) {
    bakeLocation(prj);
    bakeInheritedProperties(prj);
    bakeFiles(prj);
    bakeConfigurationTuples(prj);
}

function fetchAllNodes(node: DOMNode): DOMNode[] {
    const nodes: DOMNode[] = [];

    const queue = [node];
    while (queue.length > 0) {
        const it = queue.shift();
        if (it) {
            it.getChildren().forEach((n) => queue.push(n));
            nodes.push(it);
        }
    }

    return nodes;
}

export function bake(state: State) {
    const root = state.peek();
    if (!root) {
        throw new Error(`No root node found in state.`);
    }

    const nodes = fetchAllNodes(root);
    nodes.forEach((n) => {
        switch (n.apiName) {
            case 'workspace': {
                bakeWorkspace(n);
                break;
            }
            case 'group': {
                bakeGroup(n);
                break;
            }
            case 'project': {
                bakeProject(n);
                break;
            }
        }
    });
}