import { CppToolset, DOMNode, ToolsetRegistry } from "@conjure/core";

import './index';

describe('MSC Toolset Tests', () => {
    test('Test Include Directories', () => {
        const ts = ToolsetRegistry.get().fetch('msc');
        expect(ts).not.toBeNull();
        expect(ts?.mapFlag('includeDirs', 'inc')).toBe('/I inc');
    });

    test('Test External Include Directories', () => {
        const ts = ToolsetRegistry.get().fetch('msc');
        expect(ts).not.toBeNull();
        expect(ts?.mapFlag('externalIncludeDirs', 'inc')).toBe('/external:I inc');
    });

    test('Test Defines', () => {
        const ts = ToolsetRegistry.get().fetch('msc');
        expect(ts).not.toBeNull();
        expect(ts?.mapFlag('defines', 'DEF')).toBe('/D DEF');
    });

    test('Test CFlags', () => {
        const ts = ToolsetRegistry.get().fetch('msc') as CppToolset;
        expect(ts).not.toBeNull();
        const cfg = new DOMNode('test');
        expect(ts.getCFlags(cfg)).toStrictEqual(['/MD']);

        cfg['languageVersion'] = 'C11';
        expect(ts.getCFlags(cfg).sort()).toStrictEqual(['/MD', '/std:c11'].sort());

        cfg['optimize'] = 'On';
        expect(ts.getCFlags(cfg).sort()).toStrictEqual(['/MD', '/std:c11', '/Ot'].sort());
    });

    test('Test CxxFlags', () => {
        const ts = ToolsetRegistry.get().fetch('msc') as CppToolset;
        expect(ts).not.toBeNull();
        const cfg = new DOMNode('test');
        expect(ts.getCxxFlags(cfg).sort()).toStrictEqual(['/MD', '/EHsc'].sort());

        cfg['languageVersion'] = 'C++14';
        expect(ts.getCxxFlags(cfg).sort()).toStrictEqual(['/MD', '/std:c++14', '/EHsc'].sort());

        cfg['optimize'] = 'On';
        expect(ts.getCxxFlags(cfg).sort()).toStrictEqual(['/MD', '/std:c++14', '/Ot', '/EHsc'].sort());
    });
});