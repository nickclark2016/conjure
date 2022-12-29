import { DOMNode } from "../dom";

export enum APIAcceptedType {
    String,
    Boolean,
    Function
}

export enum APIAcceptedTypeContainer {
    Set,
    List
}

export type APICompositeAcceptedType = {
    container: APIAcceptedTypeContainer,
    type: APIAcceptedType
}

export type APIInfo = {
    name: string;
    accepts: APIAcceptedType | APICompositeAcceptedType;
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
    private static readonly _apis = new Map<string, API>();

    static register(info: APIInfo): API {
        if (APIRegistry._apis.has(info.name)) {
            throw new Error(`Attempted to register API with name ${info.name}, but it already exists.`);
        }
        const api = new API(info);
        APIRegistry._apis.set(api.name(), api);
        return api;
    }

    static fetch(name: string): API | null {
        const api = APIRegistry._apis.get(name);
        return api ? api : null;
    }

    static remove(name: string): boolean {
        return APIRegistry._apis.delete(name);
    }

    static fetchApiTable() {
        return Object.fromEntries(new Map(Array.from(this._apis, ([name, api]) => [name, api.getAction()])));
    }
}