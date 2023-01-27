import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const warningsApiInfo: FieldAPIInfo = {
    name: 'warnings',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [ 'Off', 'Extra', 'High', 'Everything' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true,
    isFiles: false
};

const externalWarningsApiInfo: FieldAPIInfo = {
    name: 'externalWarnings',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [ 'Off', 'Extra', 'High', 'Everything' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true,
    isFiles: false
};

FieldRegistry.get().register(warningsApiInfo);
FieldRegistry.get().register(externalWarningsApiInfo);