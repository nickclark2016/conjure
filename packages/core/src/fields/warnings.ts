import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const warningsApiInfo: FieldAPIInfo = {
    name: 'warnings',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when'],
    acceptedArguments: [ 'Off', 'Extra', 'High', 'Everything' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true
};

const externalWarningsApiInfo: FieldAPIInfo = {
    name: 'externalWarnings',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when'],
    acceptedArguments: [ 'Off', 'Extra', 'High', 'Everything' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true
};

FieldRegistry.get().register(warningsApiInfo);
FieldRegistry.get().register(externalWarningsApiInfo);