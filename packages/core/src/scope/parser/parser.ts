import { CstParser } from "chevrotain";
import { Tokens } from "./lexer";

export class ExpressionParser extends CstParser {
    constructor() {
        super(Tokens, {
            maxLookahead: 1
        });
        this.performSelfAnalysis();
    }

    expression = this.RULE('expression', () => this.SUBRULE(this.orExpression));

    orExpression = this.RULE('orExpression', () => {
        this.SUBRULE(this.andExpression, { LABEL: "lhs" });
        this.MANY(() => {
            this.CONSUME(Tokens.OrOperator);
            this.SUBRULE1(this.andExpression, { LABEL: "rhs" });
        });
    });

    andExpression = this.RULE('andExpression', () => {
        this.SUBRULE(this.term, { LABEL: "lhs" });
        this.MANY(() => {
            this.CONSUME(Tokens.AndOperator);
            this.SUBRULE1(this.term, { LABEL: "rhs"});
        });
    });

    notOperator = this.RULE('notOperator', () => {
        this.CONSUME(Tokens.NotOperator);
    });

    term = this.RULE("term", () => {
        this.OPTION(() => {
            this.SUBRULE(this.notOperator);
        });

        this.CONSUME(Tokens.StringLiteral);
    });
}