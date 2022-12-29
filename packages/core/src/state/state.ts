import { DOMNode } from "../dom";

export class State {
    
    private _root: DOMNode | null = null;
    private _active: DOMNode | null = null;

    private static readonly _singleton = new State();

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
        this._active = this._active?.getParent() || null;
    }

    peek(): DOMNode | null {
        return this._active;
    }

    static get() {
        return this._singleton;
    }

    static set(state: State) {
        this._singleton._root = state._root;
        this._singleton._active = state._active;
    }

}