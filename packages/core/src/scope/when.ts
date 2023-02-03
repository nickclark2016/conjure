import { APIAcceptedTypes, APIRegistry } from "../api";
import { State } from "../state";
import { includeFileStack } from "../include";
import { createMatcher } from "./parser/matcher";
import { ExpressionParser, FormulaLexer } from "./parser";
import { DOMNode } from "../dom";
import { join, relative } from "path";

export interface FilterTest {
    platform: string;
    configuration: string;
}

export interface FilterContext {
    platform: string;
    configuration: string;
    pathToWorkspace: string;
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
    return matchElement(test.configuration, incoming.configuration) && matchElement(test.platform, incoming.platform);
}

function buildFunctor() {
    const extractWorkspaceParent = function(node: DOMNode) {
        let it: DOMNode | null = node;
        while (it && it.apiName !== 'workspace') {
            it = it.getParent();
        }
        if (it) {
            return it;
        }
        throw new Error(`Failed to get workspace owning node ${node.getName()}.`);
    }

    const fn = function(test: FilterTest, callback: (c: FilterContext) => void) {
        const node = State.get().peek();

        if (!node) {
            throw new Error(`DOM state null.`);
        }

        const isValid = node.apiName === 'project' || node.apiName === 'block' || node.apiName === 'group' || node.apiName === 'workspace';

        if (!isValid) {
            throw new Error(`Scope API when not defined in scope ${node.getParent()?.apiName || '[unknown scope]'}`);
        }

        const wks = extractWorkspaceParent(node);
        const wksPath = wks.absoluteScriptLocation;
        let pathToWks = relative(node.absoluteScriptLocation, wksPath);
        if (pathToWks.length === 0) {
            pathToWks = '.';
        }
        
        const filter: Filter = {
            test,
            callback,
            scriptLocation: includeFileStack[includeFileStack.length - 1],
            absoluteScriptPath: join(process.cwd(), ...includeFileStack),
            pathToWorkspace: pathToWks
        };

        const filters: Filter[] = node.filters || [];
        filters.push(filter);
        node.filters = filters;
    }

    return fn;
}

APIRegistry.get().register({
    name: 'when',
    accepts: APIAcceptedTypes.Function,
    expectedArgumentCount: 2,
    allowedInScopes: ['project', 'block'],
    acceptedArguments: [],
    action: buildFunctor()
});