import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const optimizeApiInfo: FieldAPIInfo = {
    name: 'optimize',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when'],
    acceptedArguments: [ 'Off', 'On', 'Size', 'Speed', 'Full' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true
};

FieldRegistry.get().register(optimizeApiInfo);