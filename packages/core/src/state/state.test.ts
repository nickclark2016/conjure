import { DOMNode } from "../dom";
import { State } from "./state";

beforeEach(() => {
    State.reset();
});

describe('State Manipulation Tests', () => {
    test('Fetches default DOM state', () => {
        expect(State.get().peek()).toBeDefined();
        expect(State.get().peek()?.getName()).toBe('root');
        expect(State.get().peek()?.apiName).toBe('root');
    });
    
    test('Push DOM state', () => {
        const state = State.get();
        const root = state.peek();

        const node = new DOMNode('test');
        state.push(node);
    
        expect(state.peek()).toBe(node);
        expect(state.peek()?.getName()).toBe('test');
        expect(state.peek()?.getParent()).toBe(root);

        state.pop();

        expect(state.peek()).toBe(root);
    });

    test('Pop DOM root state.', () => {
        const state = State.get();
        expect(() => state.pop()).toThrowError();
    });
})