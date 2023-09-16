import { APIAcceptedTypes } from "../api";
import { DOMNode } from "../dom";
import { findProject } from "../scope";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const dependsOnApiInfo: FieldAPIInfo = {
    name: 'dependsOn',
    accepts: APIAcceptedTypes.Set(APIAcceptedTypes.String),
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Merge,
    inherited: true,
    isFiles: false
};

FieldRegistry.get().register(dependsOnApiInfo);

export function getAllDependencies(node: DOMNode): DOMNode[] {
    const visited = new Set<string>();
    const dfs = (n: DOMNode) => {
        visited.add(n.getName());
        const deps: string[] = n.dependsOn || [];
        deps.forEach(dep => {
            const prj = findProject(dep, node);
            if (prj) {
                dfs(prj);
            }
        });
    };

    dfs(node);

    return [...visited].map(name => findProject(name, node)).filter(prj => prj && prj !== node) as DOMNode[];
}