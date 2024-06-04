import { APIAcceptedTypes, APIBehaviorOnAccept, APIInfo, APIRegistry, ExporterArguments, ExporterRegistry, FieldAPIInfo, FieldRegistry, State } from "@conjure/core";
import { workspace } from "./workspace";
import { build } from "./build";

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
    functor: vstudio,
    builder: {
        functor: build
    }
});

// Visual Studio specific APIs

const multiProcessorCompilation: FieldAPIInfo = {
    name: "multiProcessorCompilation",
    accepts: APIAcceptedTypes.Boolean,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [true, false],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    default: true,
    inherited: true,
    isFiles: false
};

FieldRegistry.get().register(multiProcessorCompilation);