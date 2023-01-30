import { Toolset, ToolsetRegistry } from "./toolset";

describe('Toolset Registry Tests', () => {
    beforeEach(() => {
        ToolsetRegistry.get().reset();
    });

    test('Register Toolset', () => {
        const ts: Toolset = {
            name: "test_toolset",
            supportedLanguages: ["C++"],
            supportedLanguageVersions: new Map(),
            toolname: function (_type: string, _language: string): string {
                throw new Error("Function not implemented.");
            }
        };

        ToolsetRegistry.get().register(ts);

        expect(ToolsetRegistry.get().fetch("test_toolset")).toBeDefined();
        expect(ToolsetRegistry.get().fetch("test_toolset")).toBe(ts);
    });

    test('Remove Toolset', () => {
        const ts: Toolset = {
            name: "test_toolset",
            supportedLanguages: ["C++"],
            supportedLanguageVersions: new Map(),
            toolname: function (_type: string, _language: string): string {
                throw new Error("Function not implemented.");
            }
        };

        ToolsetRegistry.get().register(ts);

        expect(ToolsetRegistry.get().fetch("test_toolset")).toBeDefined();
        expect(ToolsetRegistry.get().fetch("test_toolset")).toBe(ts);

        expect(ToolsetRegistry.get().remove("test_toolset")).toBeTruthy();
        expect(ToolsetRegistry.get().fetch("test_toolset")).toBeNull();
        expect(ToolsetRegistry.get().remove("test_toolset")).toBeFalsy();
    });

    test('Remove Toolset not Registered', () => {
        expect(ToolsetRegistry.get().remove("test_toolset")).toBeFalsy();
        expect(ToolsetRegistry.get().fetch("test_toolset")).toBeNull();
    });
});