import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const runtimeApiInfo: FieldAPIInfo = {
    name: 'runtime',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [ 'Debug', 'Release' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true,
    isFiles: false
};

const staticRuntimeApiInfo: FieldAPIInfo = {
    name: 'staticRuntime',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [ 'Off', 'On' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true,
    isFiles: false
};

FieldRegistry.get().register(runtimeApiInfo);
FieldRegistry.get().register(staticRuntimeApiInfo);