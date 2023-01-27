import { APIAcceptedTypes, APIRegistry } from "../api";
import { State } from "../state";
import { includeFileStack } from "../include";

export interface FilterTest {
    platform: string;
    configuration: string;
}

export interface FilterContext {
    platform: string;
    configuration: string;
}

export type Filter = {
    test: FilterTest,
    callback: (ctx: FilterContext) => void;
    scriptLocation: string;
};

function matchElement(test: string, incoming: string) {
    if (test) {
        return test === incoming;
    }
    return true;
}

export function filterMatch(filter: Filter, incoming: FilterTest) {
    const test = filter.test;
    return matchElement(test.configuration, incoming.configuration) && matchElement(test.platform, incoming.platform);
}

APIRegistry.get().register({
    name: 'when',
    accepts: APIAcceptedTypes.Function,
    expectedArgumentCount: 2,
    allowedInScopes: ['project', 'block'],
    acceptedArguments: [],
    action: (test: FilterTest, callback: (c: FilterContext) => void) => {
        const node = State.get().peek();

        if (!node) {
            throw new Error(`DOM state null.`);
        }

        const isValid = node.apiName === 'project' || node.apiName === 'block';

        if (!isValid) {
            throw new Error(`Scope API when not defined in scope ${node.getParent()?.apiName || '[unknown scope]'}`);
        }

        const filters: Filter[] = node.filters || [];

        filters.push({
            test,
            callback,
            scriptLocation: includeFileStack[includeFileStack.length - 1]
        });

        node.filters = filters;
    }
});