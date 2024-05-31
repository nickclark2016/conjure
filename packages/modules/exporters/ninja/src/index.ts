import { ExporterArguments, ExporterRegistry, State } from "@conjure/core";
import { workspace } from "./workspace";
import { build } from "./build";

function ninja(state: State, args: ExporterArguments) {
    const root = state.peek();
    if (!root) {
        throw new Error(`[ninja] Root state must be defined.`);
    }
    const children = root.getChildren();
    children.forEach((wks) => {
        if (wks.apiName !== 'workspace') {
            throw new Error(`[ninja] Expected workspace DOM node. Received DOM node with API name ${wks.apiName}.`);
        }
        workspace(wks, args);
    });
}

ExporterRegistry.get().register({
    name: 'ninja',
    functor: ninja,
    builder: {
        functor: build
    }
});