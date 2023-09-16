import { DOMNode } from "../dom";
import { ScopeAPIInfo, ScopeRegistry } from "./scope";

export interface ProjectContext {
    name: string;
}

const projectApiInfo: ScopeAPIInfo = {
    name: 'project',
    allowedInScopes: ['workspace', 'group'],
    allowsInheritance: true,
    ctxAccumulator: (name: string) => {
        return {
            scope: 'project',
            name
        };
    }
};

ScopeRegistry.get().register(projectApiInfo);

export function findProject(name: string, searchFrom: DOMNode): DOMNode | undefined {
    let root = searchFrom;
    while (true) {
        let parent = root.getParent();
        if (parent) {
            root = parent;
        } else {
            break;
        }
    }

    return root.getAllNodes().find(node => node.apiName === 'project' && node.getName() === name);
}