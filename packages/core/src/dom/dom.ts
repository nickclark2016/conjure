export class DOMNode {
    private _parent: DOMNode | null = null;
    private _children: DOMNode[] = [];
    private _name: string;

    constructor(name: string, parent: DOMNode | null = null) {
        this._name = name;
        this._parent = parent;
    }

    addChild(node: DOMNode) {
        this._children.push(node);
    }

    getChildren(): ReadonlyArray<DOMNode> {
        return this._children;
    }

    getParent(): DOMNode | null {
        return this._parent;
    }

    setParent(node: DOMNode | null) {
        this._parent = node;
    }

    getName(): string {
        return this._name;
    }
    
    [index: string]: any;
}