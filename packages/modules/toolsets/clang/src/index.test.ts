import { ToolsetRegistry } from "@conjure/core";

import './index';

describe('Clang Toolset Tests', () => {
    test('Test Include Directories', () => {
        const ts = ToolsetRegistry.get().fetch('clang');
        expect(ts).not.toBeNull();
        expect(ts?.mapFlag('includeDirs', 'inc')).toBe('-Iinc');
    });

    test('Test External Include Directories', () => {
        const ts = ToolsetRegistry.get().fetch('clang');
        expect(ts).not.toBeNull();
        expect(ts?.mapFlag('externalIncludeDirs', 'inc')).toBe('-isystem inc');
    });

    test('Test Defines', () => {
        const ts = ToolsetRegistry.get().fetch('clang');
        expect(ts).not.toBeNull();
        expect(ts?.mapFlag('defines', 'DEF')).toBe('-DDEF');
    });
});