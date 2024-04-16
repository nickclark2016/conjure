import { APIAcceptedTypes, APIRegistry } from "../api";
import { State } from "../state";
import { includeFileStack } from "../include";
import { createMatcher } from "./parser/matcher";
import { ExpressionParser, FormulaLexer } from "./parser";
import { join } from "path";
import { pathToWorkspace } from "./scope";

export interface FilterTest {
    platform: string;
    configuration: string;
    system: string;
    architecture: string;
    toolset: string;
    exporter: string;
}

export interface FilterContext {
    platform: string;
    configuration: string;
    system: string;
    architecture: string;
    toolset: string;
    exporter: string;
    pathToWorkspace: string;
    project: any;
    workspace: any;
}

export type Filter = {
    test: FilterTest,
    callback: (ctx: FilterContext) => void;
    scriptLocation: string;
    absoluteScriptPath: string;
    pathToWorkspace: string;
};

function matchElement(test: string, incoming: string): boolean {
    if (!test) {
        return true;
    }

    const parser = new ExpressionParser();
    parser.reset();

    const tokens = FormulaLexer.tokenize(test);

    if (tokens.errors && tokens.errors.length > 0) {
        throw new Error(`Failed to properly parse filter test: ${test}. Found ${tokens.errors.length} errors.`);
    }

    parser.input = tokens.tokens;
    const matcher = createMatcher(parser);
    return matcher.visit(parser.expression(), { value: incoming });
}

export function filterMatch(filter: Filter, incoming: FilterTest) {
    const test = filter.test;
    return matchElement(test.configuration, incoming.configuration) && matchElement(test.platform, incoming.platform) && matchElement(test.system, incoming.system)
        && matchElement(test.architecture, incoming.architecture) && matchElement(test.toolset, incoming.toolset) && matchElement(test.exporter, incoming.exporter);
}

function buildFunctor() {
    const fn = function (test: FilterTest, callback: (c: FilterContext) => void) {
        const node = State.get().peek();

        if (!node) {
            throw new Error(`DOM state null.`);
        }

        const isValid = node.apiName === 'project' || node.apiName === 'block' || node.apiName === 'group' || node.apiName === 'workspace' || node.apiName === 'root';

        if (!isValid) {
            throw new Error(`Scope API when not defined in scope ${node.getParent()?.apiName || '[unknown scope]'}`);
        }

        const pathToWks = pathToWorkspace(node);

        const location = includeFileStack[includeFileStack.length - 1];
        const filter: Filter = {
            test,
            callback,
            scriptLocation: location,
            absoluteScriptPath: join(process.cwd(), location || "."),
            pathToWorkspace: pathToWks
        };

        if (node.apiName === 'root') {
            const filters: Filter[] = node.configFilters || [];
            filters.push(filter);
            node.configFilters = filters;
        } else {
            const filters: Filter[] = node.filters || [];
            filters.push(filter);
            node.filters = filters;
        }
    }

    return fn;
}

APIRegistry.get().register({
    name: 'when',
    accepts: APIAcceptedTypes.Function,
    expectedArgumentCount: 2,
    allowedInScopes: ['project', 'block', 'group', 'root'],
    acceptedArguments: [],
    action: buildFunctor()
});