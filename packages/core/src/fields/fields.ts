import { APIAcceptedType, APIAcceptedTypeContainer, APICompositeAcceptedType, APIInfo, APIRegistry } from "../api";
import { State } from "../state";

export enum APIBehaviorOnAccept {
    Merge,
    Replace
}

export type FieldAPIInfo = {
    name: string;
    accepts: APIAcceptedType | APICompositeAcceptedType;
    expectedArgumentCount: number;
    allowedInScopes: string[];
    acceptedArguments: string[] | boolean[];
    acceptBehavior: APIBehaviorOnAccept;
}

export class FieldAPI {
    private readonly _info: FieldAPIInfo;

    constructor(info: FieldAPIInfo) {
        this._info = info;
    }

    name(): string {
        return this._info.name;
    }

    allowedIn(): ReadonlyArray<String> {
        return this._info.allowedInScopes;
    }
}

function acceptAndMergeStringSets(fieldName: string, incoming: string[]) {
    const node = State.get().peek();
    if (node) {
        const value = node[fieldName] || [];
        const merged = [...value, ...incoming];
        node[fieldName] = Array.from(new Set(merged));
    } else {
        throw new Error(`Failed to merge field ${fieldName} into null node state.`);
    }
}

function acceptAndMergeStringLists(fieldName: string, incoming: string[]) {
    const node = State.get().peek();
    if (node) {
        const value = node[fieldName] || [];
        const merged = [...value, ...incoming];
        node[fieldName] = merged;
    } else {
        throw new Error(`Failed to merge field ${fieldName} into null node state.`);
    }
}

function validateArgumentCount(received: number, expected: number) {
    if (received !== expected) {
        throw new Error(`Expected ${expected}, received ${received}`);
    }
}

function validateApiScope(info: FieldAPIInfo) {
    const node = State.get().peek();
    const scopes = info.allowedInScopes;

    if (scopes) {
        if (node) {
            if (scopes.includes(node.apiName)) {
                return;
            }
        }
        throw new Error(`Field ${info.name} called out of allowed scopes.`);
    }
}

function buildAction(info: FieldAPIInfo) {
    if (info.acceptBehavior === APIBehaviorOnAccept.Merge) {
        const acceptedTypes = info.accepts as any;

        const keys = Object.keys(acceptedTypes);
        if (keys.includes('container') && keys.includes('type')) {
            const type = acceptedTypes.type;
            const container = acceptedTypes.container;
            if (type === APIAcceptedType.String && container == APIAcceptedTypeContainer.Set) {
                // needs to be function, lambda does not capture its own arguments variable
                const fn = function (values: string[]) {
                    validateApiScope(info);
                    validateArgumentCount(arguments.length, info.expectedArgumentCount);
                    acceptAndMergeStringSets(info.name, values);
                }
                return fn;
            } else if (type === APIAcceptedType.String && container == APIAcceptedTypeContainer.List) {
                // needs to be function, lambda does not capture its own arguments variable
                const fn = function (values: string[]) {
                    validateApiScope(info);
                    validateArgumentCount(arguments.length, info.expectedArgumentCount);
                    acceptAndMergeStringLists(info.name, values);
                }
                return fn;
            }
        } else {
            throw new Error(`Cannot merge non-container fields.`);
        }
    } else {
        const fn = function (value: any) {
            validateApiScope(info);
            validateArgumentCount(arguments.length, info.expectedArgumentCount);
            const node = State.get().peek();
            if (node) {
                node[info.name] = value;
            } else {
                throw new Error(`Failed to merge field ${info.name} into null node state.`);
            }
        }
        return fn;
    }
}

export class FieldRegistry {
    private static readonly _apis = new Map<string, FieldAPI>();

    static register(info: FieldAPIInfo): FieldAPI {
        if (FieldRegistry._apis.has(info.name)) {
            throw new Error(`Attempted to register Field with name ${info.name}, but it already exists.`);
        }
        const api = new FieldAPI(info);
        FieldRegistry._apis.set(api.name(), api);
        APIRegistry.register({
            ...info,
            action: buildAction(info)
        });
        return api;
    }

    static fetch(name: string): FieldAPI | null {
        const api = FieldRegistry._apis.get(name);
        return api ? api : null;
    }

    static remove(name: string): boolean {
        return FieldRegistry._apis.delete(name);
    }
}