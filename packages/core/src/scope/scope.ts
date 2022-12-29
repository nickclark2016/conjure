import { APIAcceptedType, APIRegistry } from "../api";
import { DOMNode } from "../dom";
import { State } from "../state";

export type ScopeAPIContextAccumulator = (name: string) => any;

export type ScopeAPIInfo = {
    name: string;
    allowedInScopes: string[],
    ctxAccumulator: ScopeAPIContextAccumulator
};

function validateScope(node: DOMNode): boolean {
    const scopeApi = APIRegistry.fetch(node.apiName);
    if (scopeApi) {
        const allowedIn = scopeApi.allowedIn();
        const parent = node.getParent();
        if (parent) {
            if (allowedIn.length === 0) {
                return true;
            }

            const parentName = parent.apiName;
            if (parentName) {
                return allowedIn.includes(parentName);
            }
        }
    }
    return false;
}

function validate(self: DOMNode | null): boolean {
    if (self) {
        return validateScope(self);
    }
    return false;
}

function buildFunctor(info: ScopeAPIInfo) {
    const fn = function(label: any, callback: any) {
        const ctx = info.ctxAccumulator(label);
        const node = new DOMNode(typeof label === 'string' ? label : JSON.stringify(label));
        node.apiName = info.name;

        State.get().push(node);
        const isValid = validate(State.get().peek());
        if (!isValid) {
            throw new Error(`Scope API ${info.name} not defined in scope ${node.getParent()?.getName() || '[unknown scope]'}`);
        }

        callback(ctx);

        State.get().pop();
    }

    return fn;
}

export class ScopeRegistry {
    private readonly _scopes = new Map<string, ScopeAPIInfo>();

    private static readonly _instance = new ScopeRegistry(); 

    private constructor() {}

    register(info: ScopeAPIInfo): void {
        this._scopes.set(info.name, info);

        const apiInfo = {
            name: info.name,
            accepts: APIAcceptedType.Function,
            expectedArgumentCount: 2,
            allowedInScopes: info.allowedInScopes,
            acceptedArguments: [],
            action: buildFunctor(info)
        };

        APIRegistry.register(apiInfo);
    }

    remove(name: string): boolean {
        APIRegistry.remove(name);
        return this._scopes.delete(name);
    }

    static get(): ScopeRegistry {
        return ScopeRegistry._instance;
    }
}