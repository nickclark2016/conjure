import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const runtimeApiInfo: FieldAPIInfo = {
    name: 'runtime',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when'],
    acceptedArguments: [ 'Debug', 'Release' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true
};

const staticRuntimeApiInfo: FieldAPIInfo = {
    name: 'staticRuntime',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when'],
    acceptedArguments: [ 'Off', 'On' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true
};

FieldRegistry.get().register(runtimeApiInfo);
FieldRegistry.get().register(staticRuntimeApiInfo);