import { CstNode } from "chevrotain";
import { ExpressionParser } from "./parser";

interface IMatchVisitor {
    visit(cst: CstNode, state?: any): any;
}

export function createMatcher(parser: ExpressionParser): IMatchVisitor {
    const Base = parser.getBaseCstVisitorConstructorWithDefaults();
    
    class Visitor extends Base {
        constructor() {
            super();
            this.validateVisitor();
        }

        expression(ctx: any, state?: any): any {
            return this.visit(ctx.orExpression, state);
        }

        orExpression(ctx: any, state?: any): any {
            let result = this.visit(ctx.lhs, state);
            if (!ctx.rhs) {
                return result;
            }

            for (let i = 0; i < ctx.rhs.length; ++i) {
                result = result || this.visit(ctx.rhs[i], state);
            }
            return result;
        }

        andExpression(ctx: any, state?: any): any {
            let result = this.visit(ctx.lhs, state);
            if (!ctx.rhs) {
                return result;
            }

            for (let i = 0; i < ctx.rhs.length; ++i) {
                result = result && this.visit(ctx.rhs[i], state);
            }
            return result;
        }

        term(ctx: any, state?: any): any {
            const inverted = ctx.notOperator ? this.visit(ctx.notOperator, state) : false;
            if (ctx.StringLiteral) {
                const result = (state.value as string).localeCompare(ctx.StringLiteral[0].image, undefined, {
                    sensitivity: 'accent'
                }) === 0;
                return result !== inverted; // xor values
            }
            throw new Error('Failed to parse term.');
        }

        notOperator(ctx: any, state?: any): any {
            return true;
        }
    };
    
    return new Visitor();
}