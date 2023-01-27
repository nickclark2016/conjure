import { APIAcceptedTypes, APIRegistry } from "../api";
import { DOMNode } from "../dom";
import { includeFileStack } from "../include";
import { State } from "../state";
import { join } from "path";

export type ScopeAPIContextAccumulator = (name: string) => any;

export type ScopeAPIInfo = {
    name: string;
    allowedInScopes: string[],
    allowsInheritance: boolean,
    ctxAccumulator: ScopeAPIContextAccumulator
};

function validateScope(node: DOMNode): boolean {
    const scopeApi = APIRegistry.get().fetch(node.apiName);
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

export function validate(self: DOMNode | null): boolean {
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
        node.scriptLocation = includeFileStack[includeFileStack.length - 1];
        node.absoluteScriptLocation = join(process.cwd(), ...includeFileStack);
        
        node.allowsInheritance = info.allowsInheritance;

        State.get().push(node);
        const isValid = validate(State.get().peek());
        if (!isValid) {
            throw new Error(`Scope API ${info.name} not defined in scope ${node.getParent()?.apiName || '[unknown scope]'}`);
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
            accepts: APIAcceptedTypes.Function,
            expectedArgumentCount: 2,
            allowedInScopes: info.allowedInScopes,
            acceptedArguments: [],
            action: buildFunctor(info)
        };

        APIRegistry.get().register(apiInfo);
    }

    remove(name: string): boolean {
        APIRegistry.get().remove(name);
        return this._scopes.delete(name);
    }

    static get(): ScopeRegistry {
        return ScopeRegistry._instance;
    }
}