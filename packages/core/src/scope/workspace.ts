import { ScopeAPIInfo, ScopeRegistry } from "./scope";

export interface WorkspaceContext {
    name: string;
}

const workspaceApiInfo: ScopeAPIInfo = {
    name: 'workspace',
    allowedInScopes: ['root'],
    allowsInheritance: false,
    ctxAccumulator: (name: string) => {
        return {
            scope: 'workspace',
            name
        };
    }
};

ScopeRegistry.get().register(workspaceApiInfo);