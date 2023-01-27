import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const symbolsApiInfo: FieldAPIInfo = {
    name: 'symbols',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [ 'On', 'Off' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true,
    isFiles: false
};

FieldRegistry.get().register(symbolsApiInfo);