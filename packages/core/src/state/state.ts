import { DOMNode } from "../dom";

export class State {
    
    private _root: DOMNode | null = null;
    private _active: DOMNode | null = null;

    private static _singleton = new State();

    private constructor() {
        this._root = new DOMNode('root');
        this._root.apiName = 'root';
        this._active = this._root;
    }

    push(node: DOMNode) {
        this._active?.addChild(node);
        node.setParent(this._active);
        this._active = node;
    }

    pop() {
        if (this._active === this._root) {
            throw new Error('Cannot pop root state.');
        }
        this._active = this._active?.getParent() || null;
    }

    peek(): DOMNode | null {
        return this._active;
    }

    activate(node: DOMNode | null): DOMNode | null {
        const prev = this._active;
        this._active = node;
        return prev;
    }

    static get() {
        return this._singleton;
    }

    static set(state: State) {
        this._singleton._root = state._root;
        this._singleton._active = state._active;
    }

    static reset() {
        this._singleton = new State();
    }

}