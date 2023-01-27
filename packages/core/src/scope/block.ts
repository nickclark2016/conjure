import { ScopeAPIInfo, ScopeRegistry } from "./scope";

export interface BlockContext {
    name: string;
}

const blockApiInfo: ScopeAPIInfo = {
    name: 'block',
    allowedInScopes: ['workspace', 'group', 'project'],
    allowsInheritance: false,
    ctxAccumulator: (name: string) => {
        return {
            scope: 'block',
            name
        };
    }
};

ScopeRegistry.get().register(blockApiInfo);