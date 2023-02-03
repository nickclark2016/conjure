import { createToken, Lexer, TokenType } from "chevrotain";

enum TokenName {
    AndOperator = "AndOperator",
    OrOperator = "OrOperator",
    NotOperator = "NotOperator",
    Whitespace = "Whitespace",
    StringLiteral = "StringLiteral"
}

const Whitespace = createToken({
    name: TokenName.Whitespace,
    pattern: /\s+/,
    group: Lexer.SKIPPED
});

const StringLiteral = createToken({
    name: TokenName.StringLiteral,
    pattern: /[a-zA-Z]\w*/
});

const AndOperator = createToken({
    name: TokenName.AndOperator,
    pattern: /and/,
    longer_alt: StringLiteral
});

const OrOperator = createToken({
    name: TokenName.OrOperator,
    pattern: /or/,
    longer_alt: StringLiteral
});

const NotOperator = createToken({
    name: TokenName.NotOperator,
    pattern: /not/,
    longer_alt: StringLiteral
});

const prioritized = [
    Whitespace,
    NotOperator,
    AndOperator,
    OrOperator,
    StringLiteral,
];

export const FormulaLexer = new Lexer(prioritized, {
    ensureOptimizations: true
});

export type TokenTypeDict = { [ key in TokenName ]: TokenType };

export const Tokens = prioritized.reduce((acc, tokenType) => {
    acc[tokenType.name as TokenName] = tokenType;
    return acc;
}, {} as TokenTypeDict);