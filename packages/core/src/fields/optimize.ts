import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const optimizeApiInfo: FieldAPIInfo = {
    name: 'optimize',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [ 'Off', 'On', 'Size', 'Speed', 'Full' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true,
    isFiles: false
};

FieldRegistry.get().register(optimizeApiInfo);