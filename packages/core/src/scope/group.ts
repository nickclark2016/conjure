import { ScopeAPIInfo, ScopeRegistry } from "./scope";

export interface GroupContext {
    name: string;
}

const groupApiInfo: ScopeAPIInfo = {
    name: 'group',
    allowedInScopes: ['workspace'],
    allowsInheritance: true,
    ctxAccumulator: (name: string) => {
        return {
            scope: 'group',
            name
        };
    }
};

ScopeRegistry.get().register(groupApiInfo);