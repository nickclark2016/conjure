import { ExporterArguments, ExporterRegistry, State, TextWriter } from "@conjure/core";
import { workspace } from "./workspace";

function makefile(state: State, args: ExporterArguments) {
    const root = state.peek();
    if (!root) {
        throw new Error(`[makefile] Root state must be defined.`);
    }

    const descendants = root.getAllNodes().filter(node => node !== root).filter(node => node.apiName === 'workspace' || node.apiName === 'project');
    descendants.forEach((node) => {
        const sameFolder = descendants.filter((desc) => {
            return node.location === desc.location && node.scriptLocation !== desc.scriptLocation;
        });

        if (sameFolder.length > 1) {
            sameFolder.forEach(n => {
                n.__makefile_name = `${n.getName()}.make`;
            });

            node.__makefile_name = `${node.getName()}.make`;
        } else {
            node.__makefile_name = `Makefile`;
        }
    });

    const children = root.getChildren();

    children.forEach((wks) => {
        if (wks.apiName !== 'workspace') {
            throw new Error(`[makefile] Expected workspace DOM node. Received DOM node with API name ${wks.apiName}.`);
        }
        workspace(wks, args);
    });
}

ExporterRegistry.get().register({
    name: 'gmake',
    functor: makefile
});