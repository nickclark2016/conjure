import { ExpressionParser } from "./parser";

describe('Expression Parser Tests', () => {
    test('Parser Creation', () => {
        const parser = new ExpressionParser();
        parser.reset();

        expect(parser).toBeDefined();
    });
});