import { ExporterArguments, ExporterRegistry, State } from "@conjure/core";
import { workspace } from "./workspace";

function vstudio(state: State, args: ExporterArguments) {
    const root = state.peek();
    if (!root) {
        throw new Error(`[vstudio] Root state must be defined.`);
    }
    const children = root.getChildren();
    children.forEach((wks) => {
        if (wks.apiName !== 'workspace') {
            throw new Error(`[vstudio] Expected workspace DOM node. Received DOM node with API name ${wks.apiName}.`);
        }
        workspace(wks, args);
    });
}

ExporterRegistry.get().register({
    name: 'vstudio',
    functor: vstudio
});