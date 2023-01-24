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
        node.setParent(this);
    }

    removeChild(node: DOMNode) {
        node.setParent(null);
        this._children = this._children.filter(n => n !== node);
    }

    getChildren(): ReadonlyArray<DOMNode> {
        return this._children;
    }

    getAllNodes(): ReadonlyArray<DOMNode> {
        const nodes: DOMNode[] = [];

        const queue: DOMNode[] = [this];
        while (queue.length > 0) {
            const it = queue.shift();
            if (it) {
                it.getChildren().forEach((n) => queue.push(n));
                nodes.push(it);
            }
        }

        return nodes;
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