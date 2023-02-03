import { DOMNode } from "../dom";
import { APIBehaviorOnAccept, FieldAPI, FieldRegistry } from "../fields";
import { glob } from "glob";
import { join, normalize, relative } from "path";
import { State } from "../state";
import { Filter, filterMatch } from "../scope";

function bakeLocation(node: DOMNode) {
    const scriptLocation = node.scriptLocation;
    const scriptDirectory = scriptLocation;
    const location = scriptDirectory;
    if (node.location) {
        node.location = normalize(join(location, node.location));
    } else {
        node.location = location;
    }
}

function bakeInheritedProperties(node: DOMNode) {
    if (node.allowsInheritance !== true) {
        return;
    }

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

function cartesianProduct<Type>(sets: Type[][]): Type[][] {
    return sets.reduce<Type[][]>(
        (results, ids) =>
            results
                .map(result => ids.map(id => [...result, id]))
                .reduce((nested, result) => [...nested, ...result]),
        [[]]
    );
}

function bakeDefaults(node: DOMNode) {
    FieldRegistry.get().all().filter(api => api.allowedIn().includes(node.apiName)).forEach(api => {
        const defaultValue = api.defaultValue()
        if (defaultValue && node[api.name()] === undefined) {
            node[api.name()] = defaultValue;
        }
    });
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

function normalizeFileFields(node: DOMNode) {
    FieldRegistry.get().all().filter(field => field.isFileField()).forEach(field => {
        const name = field.name();
        const contents = node[name];
        if (contents) {
            if (Array.isArray(contents)) {
                node[name] = contents.map(file => normalize(file));
            } else if (typeof contents === 'string') {
                node[name] = normalize(contents);
            } else {
                throw new Error(`Unknown field type.`);
            }
        }
    })
}

function bakeConfigurationTuples(parent: DOMNode) {
    const configurations: string[] | undefined = parent.configurations;
    const platforms: string[] | undefined = parent.platforms;

    if (!configurations || !platforms) {
        throw new Error(`Failed to find configurations and/or platforms for project ${parent.getName()}.`);
    }

    const cartesian = cartesianProduct([configurations, platforms]);

    const createNode = (configuration: string, platform: string): DOMNode => {
        const node = new DOMNode(`filter_${configuration}_${platform}`);
        node.apiName = 'when';
        node.configuration = configuration;
        node.platform = platform;
        node.allowsInheritance = true;

        return node;
    };

    cartesian.forEach(([configuration, platform]: string[]) => {
        const node = createNode(configuration, platform);

        parent.addChild(node);
        const filters: Filter[] = parent.filters || [];

        filters.filter((filter: Filter) => {
            return filterMatch(filter, {
                platform,
                configuration
            });
        }).forEach((filter: Filter) => {
            const old = State.get().activate(node);

            filter.callback({
                platform,
                configuration,
                pathToWorkspace: filter.pathToWorkspace
            });

            State.get().activate(old);

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
        bakeFiles(node);
        normalizeFileFields(node);
    });
}

function applyBlocks(node: DOMNode, blocks: ReadonlyArray<DOMNode>) {
    const mapping = new Map(blocks.map((blk) => [blk.getName(), blk]));

    // gather all the transient dependencies
    const deps: string[] = [];
    const queue = new Array(...(node.uses || []));
    while (queue.length > 0) {
        const blockName = queue.shift();
        if (blockName) {
            const block = mapping.get(blockName);
            if (!block) {
                throw new Error(`Failed to find block with name ${block}.`);
            }
            queue.push(...(block.uses || []));
            deps.push(blockName);
        }
    }

    const depBlocks = deps.map((dep) => {
        const block = mapping.get(dep);
        if (block) {
            return block;
        }
        // Should never be reached
        throw new Error(`Failed to find block with name ${block}.`);
    });

    // Apply blocks to original node
    depBlocks.forEach((block) => {
        const sharedFields = Object.entries(block).map(([name, value]: [string, any]) => {
            return {
                name: name,
                field: FieldRegistry.get().fetch(name),
                value: value
            };
        }).filter((obj) => obj.field !== null);

        sharedFields.forEach(({ name, field, value }) => {
            if (field) {
                const val = field.isFileField() ? (() => {
                    if (Symbol.iterator in Object(value)) {
                        return (value as string[]).map((path) => {
                            const absolutePath = join(block.absoluteScriptLocation, path);
                            const pathToHere = node.absoluteScriptLocation;
                            const relativeToPath = relative(pathToHere, absolutePath);
                            return relativeToPath;
                        });
                    } else {
                        const absolutePath = join(block.absoluteScriptLocation, value);
                        const pathToHere = node.absoluteScriptLocation;
                        const relativeToPath = relative(pathToHere, absolutePath);
                        return relativeToPath;
                    }
                })() : value;

                switch (field.behaviorOnAccept()) {
                    case APIBehaviorOnAccept.Merge:
                        node[name] = field.acceptedTypes().merge(node[name], val);
                        break;
                    case APIBehaviorOnAccept.Replace:
                        node[name] = field.acceptedTypes().replace(node[name], val);
                        break;
                    case APIBehaviorOnAccept.Remove:
                        node[name] = field.acceptedTypes().remove(node[name], val);
                        break;
                }
            }
        });
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

/**
 * Merges children group nodes with the same name into a single group node.
 * 
 * @param wksOrGrp DOM Node to perform grouping operation on
 * @pre wksOrGrp is a group or workspace node
 */
function mergeGroups(wksOrGrp: DOMNode) {
    const childGroups = wksOrGrp.getChildren().filter((n) => {
        return n.apiName === 'group';
    });

    // bucket the groups into a map
    const childGroupMap: Map<string, Array<DOMNode>> = new Map();
    childGroups.forEach((child) => {
        if (!childGroupMap.has(child.getName())) {
            childGroupMap.set(child.getName(), []);
        }
        childGroupMap.get(child.getName())?.push(child);
    });

    // Merge groups with same name. Remove groups, merge children into common node, add back common node
    childGroupMap.forEach((nodes, name) => {
        if (nodes.length >= 2) {
            const newGroup = new DOMNode(name);
            nodes.flatMap((node) => node.getChildren()).forEach((n) => {
                wksOrGrp.removeChild(n);
                newGroup.addChild(n);
            });
            wksOrGrp.addChild(newGroup);
        }
    });
}

export function bake(state: State) {
    const root = state.peek();
    if (!root) {
        throw new Error(`No root node found in state.`);
    }

    const nodes = root.getAllNodes();
    const blocks = nodes.filter((node) => node.apiName === 'block');

    nodes.forEach((node) => applyBlocks(node, blocks));
    nodes.forEach((node) => bakeDefaults(node));

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

    nodes.forEach((n) => {
        switch (n.apiName) {
            case 'workspace':
            case 'group': {
                mergeGroups(n);
                break;
            }
        }
    });

    nodes.forEach((n) => normalizeFileFields(n));
}