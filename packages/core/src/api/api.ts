export interface IAPIAcceptedType {
    merge: (existing: any, incoming: any) => any;
    replace: (existing: any, incoming: any) => any;
    remove: (existing: any, incoming: any) => any;
    valid: (value: any) => boolean;
}

export class APIAcceptedTypes {
    static String: IAPIAcceptedType = {
        merge: function (_existing: any, _incoming: any): any {
            throw new Error(`Cannot merge two strings together.`);
        },
        replace: function (_existing: any, incoming: any): any {
            if (!this.valid(incoming)) {
                throw new Error(`Incoming value is not a string type.`);
            }
            return incoming;
        },
        remove: function (existing: any, incoming: any): any {
            if (existing === incoming) {
                return null;
            } else {
                return existing;
            }
        },
        valid: function (value: any): boolean {
            return typeof value === 'string';
        }
    };

    static Boolean: IAPIAcceptedType = {
        merge: function (_existing: any, _incoming: any) {
            throw new Error(`Cannot merge two booleans together.`);
        },
        replace: function (_existing: any, incoming: any) {
            if (!this.valid(incoming)) {
                throw new Error(`Incoming value is not a boolean type.`);
            }
            return incoming;
        },
        remove: function (existing: any, incoming: any) {
            if (existing === incoming) {
                return null;
            } else {
                return existing;
            }
        },
        valid: function (value: any): boolean {
            return typeof value === 'boolean';
        }
    };

    static Function: IAPIAcceptedType = {
        merge: function (_existing: any, _incoming: any) {
            throw new Error(`Cannot merge two functions together.`);
        },
        replace: function (_existing: any, incoming: any) {
            if (typeof incoming !== 'function') {
                throw new Error(`Incoming value is not a function type.`);
            }
            return incoming;
        },
        remove: function (existing: any, incoming: any) {
            if (existing === incoming) {
                return null;
            } else {
                return existing;
            }
        },
        valid: function (incoming: any): boolean {
            return typeof incoming === 'function';
        }
    };

    static List(inner: IAPIAcceptedType): IAPIAcceptedType {
        return {
            merge: function (existing: any, incoming: any) {
                if (!this.valid(incoming)) {
                    throw new Error(`Incoming type is not an array.`);
                }
                return [...(existing || []), ...incoming];
            },
            replace: function (_existing: any, incoming: any) {
                if (!this.valid(incoming)) {
                    throw new Error(`Incoming type is not an array.`);
                }
                return incoming;
            },
            remove: function (existing: any, incoming: any) {
                return ((existing || []) as any[]).filter((value) => !(incoming as any[]).includes(value));
            },
            valid: function (incoming: any): boolean {
                return Array.isArray(incoming) && (incoming as any[]).reduce((accumulator, current) => {
                    return accumulator && inner.valid(current);
                }, true);
            }
        }
    };

    static Set(inner: IAPIAcceptedType): IAPIAcceptedType {
        return {
            merge: function (existing: any, incoming: any) {
                if (!this.valid(incoming)) {
                    throw new Error(`Incoming type is not an array.`);
                }
                return Array.from(new Set([...(existing || []), ...incoming]));
            },
            replace: function (_existing: any, incoming: any) {
                if (!this.valid(incoming)) {
                    throw new Error(`Incoming type is not an array.`);
                }
                return incoming;
            },
            remove: function (existing: any, incoming: any) {
                return ((existing || []) as any[]).filter((value) => !(incoming as any[]).includes(value));
            },
            valid: function (incoming: any): boolean {
                return Array.isArray(incoming) && (incoming as any[]).length === (new Set(incoming)).size && (incoming as any[]).reduce((accumulator, current) => {
                    return accumulator && inner.valid(current);
                }, true);;
            }
        }
    };

    // TODO: Files and File Sets
}

export type APIInfo = {
    name: string;
    accepts: IAPIAcceptedType;
    expectedArgumentCount: number;
    allowedInScopes: string[];
    acceptedArguments: string[] | boolean[];
    action: any; // must be function-like
}

export class API {
    private readonly _info: APIInfo;

    constructor(info: APIInfo) {
        this._info = info;
    }

    name(): string {
        return this._info.name;
    }

    allowedIn(): ReadonlyArray<String> {
        return this._info.allowedInScopes;
    }

    getAction(): any {
        return this._info.action;
    }
}

export class APIRegistry {
    private static _instance: APIRegistry = new APIRegistry();

    private readonly _apis = new Map<string, API>();

    private constructor() {

    }

    static get(): APIRegistry {
        return APIRegistry._instance;
    }

    static set(registry: APIRegistry) {
        APIRegistry._instance = registry;
    }

    register(info: APIInfo): API {
        if (this._apis.has(info.name)) {
            throw new Error(`Attempted to register API with name ${info.name}, but it already exists.`);
        }
        const api = new API(info);
        this._apis.set(api.name(), api);
        return api;
    }

    fetch(name: string): API | null {
        return this._apis.get(name) || null;
    }

    remove(name: string): boolean {
        return this._apis.delete(name);
    }

    fetchApiTable() {
        return Object.fromEntries(new Map(Array.from(this._apis, ([name, api]) => [name, api.getAction()])));
    }
}