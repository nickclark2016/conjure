import { FormulaLexer } from "./lexer";
import { createMatcher } from "./matcher";
import { ExpressionParser } from "./parser";

describe('Expression Matcher Tests', () => {
    test('Match simple equality', () => {
        const parser = new ExpressionParser();
        parser.reset();

        const matcher = createMatcher(parser);
        expect(matcher).toBeDefined();

        const input = 'exists';
        parser.input = FormulaLexer.tokenize(input).tokens;
        const result = matcher.visit(parser.expression(), { value: 'exists' });
        expect(result).toBeTruthy();
    });

    test('Match simple equality with case mismatch', () => {
        const parser = new ExpressionParser();
        parser.reset();

        const matcher = createMatcher(parser);
        expect(matcher).toBeDefined();

        const input = 'exists';
        parser.input = FormulaLexer.tokenize(input).tokens;
        const result = matcher.visit(parser.expression(), { value: 'Exists' });
        expect(result).toBeTruthy();
    });

    test('Match simple inequality', () => {
        const parser = new ExpressionParser();
        parser.reset();

        const matcher = createMatcher(parser);
        expect(matcher).toBeDefined();

        const input = 'invalid';
        parser.input = FormulaLexer.tokenize(input).tokens;
        const result = matcher.visit(parser.expression(), { value: 'exists' });
        expect(result).toBeFalsy();
    });

    test('Match simple NOT expression', () => {
        const parser = new ExpressionParser();
        parser.reset();

        const matcher = createMatcher(parser);
        expect(matcher).toBeDefined();

        const input = 'not invalid';
        parser.input = FormulaLexer.tokenize(input).tokens;
        const result = matcher.visit(parser.expression(), { value: 'exists' });
        expect(result).toBeTruthy();
    });

    test('Match simple OR expression', () => {
        const parser = new ExpressionParser();
        parser.reset();

        const matcher = createMatcher(parser);
        expect(matcher).toBeDefined();

        const input = 'exists or invalid';
        parser.input = FormulaLexer.tokenize(input).tokens;
        const result = matcher.visit(parser.expression(), { value: 'exists' });
        expect(result).toBeTruthy();
    });

    test('Match simple OR expression inequality', () => {
        const parser = new ExpressionParser();
        parser.reset();

        const matcher = createMatcher(parser);
        expect(matcher).toBeDefined();

        const input = 'nope or invalid';
        parser.input = FormulaLexer.tokenize(input).tokens;
        const result = matcher.visit(parser.expression(), { value: 'exists' });
        expect(result).toBeFalsy();
    });

    test('Match simple AND expression with same values', () => {
        const parser = new ExpressionParser();
        parser.reset();

        const matcher = createMatcher(parser);
        expect(matcher).toBeDefined();

        const input = 'exists and exists';
        parser.input = FormulaLexer.tokenize(input).tokens;
        const result = matcher.visit(parser.expression(), { value: 'exists' });
        expect(result).toBeTruthy();
    });

    test('Match simple AND expression with single match', () => {
        const parser = new ExpressionParser();
        parser.reset();

        const matcher = createMatcher(parser);
        expect(matcher).toBeDefined();

        const input = 'exists and invalid';
        parser.input = FormulaLexer.tokenize(input).tokens;
        const result = matcher.visit(parser.expression(), { value: 'exists' });
        expect(result).toBeFalsy();
    });

    test('Match simple AND expression with no match', () => {
        const parser = new ExpressionParser();
        parser.reset();

        const matcher = createMatcher(parser);
        expect(matcher).toBeDefined();

        const input = 'nope and invalid';
        parser.input = FormulaLexer.tokenize(input).tokens;
        const result = matcher.visit(parser.expression(), { value: 'exists' });
        expect(result).toBeFalsy();
    });

    test('Match complex OR/NOT expression', () => {
        const parser = new ExpressionParser();
        parser.reset();

        const matcher = createMatcher(parser);
        expect(matcher).toBeDefined();

        const input = 'exists or not valid';
        parser.input = FormulaLexer.tokenize(input).tokens;
        const result = matcher.visit(parser.expression(), { value: 'exists' });
        expect(result).toBeTruthy();
    });

    test('Match complex OR/NOT expression with no match', () => {
        const parser = new ExpressionParser();
        parser.reset();

        const matcher = createMatcher(parser);
        expect(matcher).toBeDefined();

        const input = 'valid or not exists';
        parser.input = FormulaLexer.tokenize(input).tokens;
        const result = matcher.visit(parser.expression(), { value: 'exists' });
        expect(result).toBeFalsy();
    });
});