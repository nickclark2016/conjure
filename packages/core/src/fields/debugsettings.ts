import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const debugDirectory: FieldAPIInfo = {
    name: 'debugDirectory',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true,
    isFiles: true
};

const debuggerType: FieldAPIInfo = {
    name: 'debuggerType',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true,
    isFiles: false
};

FieldRegistry.get().register(debugDirectory);
FieldRegistry.get().register(debuggerType);