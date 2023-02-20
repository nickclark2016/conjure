/**
 * Interface describing behavior when Conjure encounters an API call.
 */
export interface IAPIAcceptedType {
    /**
     * Merge an existing value with a new value
     * 
     * @param existing Value to merge new values into
     * @param incoming Incoming values to merge
     * @returns Merged values
     * @throws Throws an error if the operation is not supported
     */
    merge: (existing: any, incoming: any) => any;

    /**
     * Replaces an existing value with a new value
     * 
     * @param existing Value to replace
     * @param incoming Value to replace with
     * @returns Replaced values
     * @throws Throws an error if the operation is not supported
     */
    replace: (existing: any, incoming: any) => any;

    /**
     * Removes values from an existing value
     * 
     * @param existing Values to remove from
     * @param incoming Values to remove
     * @returns The difference between the existing and incoming values
     * @throws Throws an error if the operation is not supported
     */
    remove: (existing: any, incoming: any) => any;

    /**
     * Validates a value for the field type
     * 
     * @param value Value to validate against 
     * @returns True if the value is legal for the API type, else false
     */
    valid: (value: any) => boolean;
}

export class APIAcceptedTypes {
    /**
     * API type for string values.  Does not support value merge.
     */
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

    /**
     * API type for boolean values. Does not support value merge.
     */
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

    /**
     * API type for function values. Does not support merge.
     */
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

    /**
     * Function to compose an API type of a list-like container.
     * 
     * @param inner Inner API type contained
     * @returns API type for a list-like value
     */
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

    /**
     * Function to compose an API type of a set-like container.
     * 
     * @param inner Inner API type contained
     * @returns API type for a set-like value
     */
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

/**
 * Information for API Creation
 */
export type APIInfo = {
    /**
     * Name of the API
     */
    name: string;

    /**
     * Value type accepted by the API
     */
    accepts: IAPIAcceptedType;

    /**
     * Number of arguments expected by the API
     */
    expectedArgumentCount: number;

    /**
     * Scope types that the API is allowed to be called in
     */
    allowedInScopes: string[];

    /**
     * Arguments accepted by the API. If an empty list, then all arguments are accepted
     */
    acceptedArguments: string[] | boolean[];

    /**
     * Action to invoke on API call.  Value must be function-like.
     */
    action: any; // must be function-like
}

/**
 * Class encapsulating API behavior.
 */
export class API {
    private readonly _info: APIInfo;

    /**
     * Constructs a new API
     * 
     * @param info API info to construct from
     */
    constructor(info: APIInfo) {
        this._info = info;
    }

    /**
     * Gets the name of the API
     * 
     * @returns Name of the API
     */
    name(): string {
        return this._info.name;
    }

    /**
     * Gets the scopes that the API is allowed in
     * 
     * @returns Read-only view of the legal scope names
     */
    allowedIn(): ReadonlyArray<String> {
        return this._info.allowedInScopes;
    }

    /**
     * Gets the action associated with the API
     * 
     * @returns action of the API 
     */
    getAction(): any {
        return this._info.action;
    }
}

/**
 * Registry containing all APIs in Conjure
 */
export class APIRegistry {
    private static _instance: APIRegistry = new APIRegistry();

    private readonly _apis = new Map<string, API>();

    private constructor() {

    }

    /**
     * Gets the global registry instance
     * 
     * @returns Global registry instance
     */
    static get(): APIRegistry {
        return APIRegistry._instance;
    }

    /**
     * Sets the global registry instance
     * 
     * @param registry Registry instace 
     */
    static set(registry: APIRegistry): void {
        APIRegistry._instance = registry;
    }

    /**
     * Registers API info to construct a new API for access within scripts
     * 
     * @param info API info to construct API from
     * @returns Registered APIs
     * @throws Error if API already exists in registry with the name in the API info
     */
    register(info: APIInfo): API {
        if (this._apis.has(info.name)) {
            throw new Error(`Attempted to register API with name ${info.name}, but it already exists.`);
        }
        const api = new API(info);
        this._apis.set(api.name(), api);
        return api;
    }

    /**
     * Fetches an API given a name
     * 
     * @param name Name of the API to fetch
     * @returns API if it exists or null
     */
    fetch(name: string): API | null {
        return this._apis.get(name) || null;
    }

    /**
     * Removes an API given a name
     * 
     * @param name Name of the toolset to remove
     * @returns True if an API was removed, else false
     */
    remove(name: string): boolean {
        return this._apis.delete(name);
    }

    /**
     * Builds a table object containing a mapping of API names to API actions.
     * 
     * @returns API action table
     */
    fetchApiTable(): any {
        return Object.fromEntries(new Map(Array.from(this._apis, ([name, api]) => [name, api.getAction()])));
    }
}