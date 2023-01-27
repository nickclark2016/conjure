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