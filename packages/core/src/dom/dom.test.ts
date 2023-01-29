import { State } from "../state";
import { DOMNode } from "./dom";

beforeEach(() => {
    State.reset();
});

describe('Configuration DOM Tests', () => {
    test('Constructs a DOM Node', () => {
        const node = new DOMNode('name');
        expect(node.getName()).toBe('name');
        expect(node.getParent()).toBeNull();
        expect(node.getChildren()).toBeDefined();
        expect(node.getChildren().length).toBe(0);
        expect(node.getAllNodes()).toBeDefined();
        expect(node.getAllNodes().length).toBe(1);
        expect(node.getAllNodes().at(0)).toBe(node);
    });

    test('Construct DOM Node with Single Child', () => {
        const parent = new DOMNode('parent');
        const child = new DOMNode('child', parent);

        expect(parent.getParent()).toBeNull();
        expect(parent.getChildren()).toBeDefined();
        expect(parent.getChildren().length).toBe(1);
        expect(parent.getChildren().at(0)).toBe(child);
        expect(child.getParent()).toBe(parent);
        expect(child.getChildren()).toBeDefined();
        expect(child.getChildren().length).toBe(0);

        expect(parent.getAllNodes()).toBeDefined();
        expect(parent.getAllNodes().length).toBe(2);
        expect(parent.getAllNodes().at(0)).toBe(parent);
        expect(parent.getAllNodes().at(1)).toBe(child);
    });

    test('Construct DOM Node with Multiple Children', () => {
        const parent = new DOMNode('parent');
        const child1 = new DOMNode('child1', parent);
        const child2 = new DOMNode('child2', parent);

        expect(parent.getParent()).toBeNull();
        expect(parent.getChildren()).toBeDefined();
        expect(parent.getChildren().length).toBe(2);
        expect(parent.getChildren().at(0)).toBe(child1);
        expect(parent.getChildren().at(1)).toBe(child2);

        expect(child1.getParent()).toBe(parent);
        expect(child1.getChildren()).toBeDefined();
        expect(child1.getChildren().length).toBe(0);

        expect(child2.getParent()).toBe(parent);
        expect(child2.getChildren()).toBeDefined();
        expect(child2.getChildren().length).toBe(0);

        expect(parent.getAllNodes()).toBeDefined();
        expect(parent.getAllNodes().length).toBe(3);
        expect(parent.getAllNodes().at(0)).toBe(parent);
        expect(parent.getAllNodes().at(1)).toBe(child1);
        expect(parent.getAllNodes().at(2)).toBe(child2);
    });

    test('Construct DOM Node with Grandchild', () => {
        const parent = new DOMNode('parent');
        const child = new DOMNode('child', parent);
        const grandchild = new DOMNode('grandchild', child);

        expect(parent.getParent()).toBeNull();
        expect(parent.getChildren()).toBeDefined();
        expect(parent.getChildren().length).toBe(1);
        expect(parent.getChildren().at(0)).toBe(child);

        expect(child.getParent()).toBe(parent);
        expect(child.getChildren()).toBeDefined();
        expect(child.getChildren().length).toBe(1);
        expect(child.getChildren().at(0)).toBe(grandchild);

        expect(grandchild.getParent()).toBe(child);
        expect(grandchild.getChildren()).toBeDefined();
        expect(grandchild.getChildren().length).toBe(0);

        expect(parent.getAllNodes()).toBeDefined();
        expect(parent.getAllNodes().length).toBe(3);
        expect(parent.getAllNodes().at(0)).toBe(parent);
        expect(parent.getAllNodes().at(1)).toBe(child);
        expect(parent.getAllNodes().at(2)).toBe(grandchild);

        expect(child.getAllNodes()).toBeDefined();
        expect(child.getAllNodes().length).toBe(2);
        expect(child.getAllNodes().at(0)).toBe(child);
        expect(child.getAllNodes().at(1)).toBe(grandchild);
    });

    test('Construct DOM Node with Multiple Children and a Grandchild', () => {
        const parent = new DOMNode('parent');
        const child1 = new DOMNode('child1', parent);
        const child2 = new DOMNode('child2', parent);
        const grandchild = new DOMNode('grandchild', child1);

        expect(parent.getParent()).toBeNull();
        expect(parent.getChildren()).toBeDefined();
        expect(parent.getChildren().length).toBe(2);
        expect(parent.getChildren().at(0)).toBe(child1);
        expect(parent.getChildren().at(1)).toBe(child2);

        expect(child1.getParent()).toBe(parent);
        expect(child1.getChildren()).toBeDefined();
        expect(child1.getChildren().length).toBe(1);

        expect(child2.getParent()).toBe(parent);
        expect(child2.getChildren()).toBeDefined();
        expect(child2.getChildren().length).toBe(0);

        expect(grandchild.getParent()).toBe(child1);
        expect(grandchild.getChildren()).toBeDefined();
        expect(grandchild.getChildren().length).toBe(0);

        expect(parent.getAllNodes()).toBeDefined();
        expect(parent.getAllNodes().length).toBe(4);
        expect(parent.getAllNodes().at(0)).toBe(parent);
        expect(parent.getAllNodes().at(1)).toBe(child1);
        expect(parent.getAllNodes().at(2)).toBe(child2);
        expect(parent.getAllNodes().at(3)).toBe(grandchild);
    });

    test('Construct DOM Node with Multiple Children and Remove a Child', () => {
        const parent = new DOMNode('parent');
        const child1 = new DOMNode('child1', parent);
        const child2 = new DOMNode('child2', parent);

        parent.removeChild(child2);

        expect(parent.getParent()).toBeNull();
        expect(parent.getChildren()).toBeDefined();
        expect(parent.getChildren().length).toBe(1);
        expect(parent.getChildren().at(0)).toBe(child1);

        expect(child1.getParent()).toBe(parent);
        expect(child1.getChildren()).toBeDefined();
        expect(child1.getChildren().length).toBe(0);

        expect(child2.getParent()).toBeNull();
        expect(child2.getChildren()).toBeDefined();
        expect(child2.getChildren().length).toBe(0);
    });
});