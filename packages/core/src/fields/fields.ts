import { APIRegistry, IAPIAcceptedType } from "../api";
import { State } from "../state";

export enum APIBehaviorOnAccept {
    Merge,
    Remove,
    Replace,
}

// TODO: Default Values
export type FieldAPIInfo = {
    name: string;
    accepts: IAPIAcceptedType;
    expectedArgumentCount: number;
    allowedInScopes: string[];
    acceptedArguments: any[];
    acceptBehavior: APIBehaviorOnAccept;
    inherited: boolean;
    isFiles: boolean;
    isFilePattern?: boolean;
    default?: any;
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

    behaviorOnAccept(): APIBehaviorOnAccept {
        return this._info.acceptBehavior;
    }

    acceptedTypes(): IAPIAcceptedType {
        return this._info.accepts;
    }

    isInheritable(): boolean {
        return this._info.inherited;
    }

    addAcceptedArguments(...args: string[] | boolean[]): void {
        const updated = new Set(this._info.acceptedArguments);
        args.forEach(arg => updated.add(arg));
        this._info.acceptedArguments = Array.from(updated);
    }

    isFileField(): boolean {
        return this._info.isFiles;
    }

    isFilePattern(): boolean {
        return this.isFileField() && this._info.isFilePattern || false;
    }

    defaultValue(): any {
        return this._info.default;
    }
}

function buildAction(info: FieldAPIInfo) {
    return (incoming: any[]) => {
        const node = State.get().peek();
        const fieldName = info.name;
        if (node) {
            const existing: string[] = node[fieldName] || [];
            node[fieldName] = (() => {
                switch (info.acceptBehavior) {
                    case APIBehaviorOnAccept.Merge: {
                        return info.accepts.merge(existing, incoming);
                    }
                    case APIBehaviorOnAccept.Remove: {
                        return info.accepts.remove(existing, incoming);
                    }
                    case APIBehaviorOnAccept.Replace: {
                        return info.accepts.replace(existing, incoming);
                    }
                }
            })();
        } else {
            throw new Error(`Failed to remove field ${fieldName} into null node state.`);
        }
    };
}

export class FieldRegistry {
    private static _instance: FieldRegistry = new FieldRegistry();
    private readonly _apis = new Map<string, FieldAPI>();

    private constructor() { }

    static get(): FieldRegistry {
        return FieldRegistry._instance;
    }

    static set(registry: FieldRegistry) {
        this._instance = registry;
    }

    register(info: FieldAPIInfo): FieldAPI {
        if (this._apis.has(info.name)) {
            throw new Error(`Attempted to register Field with name ${info.name}, but it already exists.`);
        }
        const api = new FieldAPI(info);
        this._apis.set(api.name(), api);
        APIRegistry.get().register({
            ...info,
            action: buildAction(info)
        });
        return api;
    }

    fetch(name: string): FieldAPI | null {
        const api = this._apis.get(name);
        return api ? api : null;
    }

    remove(name: string): boolean {
        return this._apis.delete(name);
    }

    all(): ReadonlyArray<FieldAPI> {
        return Array.from(this._apis.values());
    }
}