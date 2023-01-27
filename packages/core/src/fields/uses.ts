import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const usesApiInfo: FieldAPIInfo = {
    name: 'uses',
    accepts: APIAcceptedTypes.Set(APIAcceptedTypes.String),
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Merge,
    inherited: true,
    isFiles: false
};

FieldRegistry.get().register(usesApiInfo);