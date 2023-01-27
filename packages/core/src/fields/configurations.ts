import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const configurationsApiInfo: FieldAPIInfo = {
    name: 'configurations',
    accepts: APIAcceptedTypes.Set(APIAcceptedTypes.String),
    expectedArgumentCount: 1,
    allowedInScopes: ['workspace'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Merge,
    inherited: true,
    isFiles: false
};

FieldRegistry.get().register(configurationsApiInfo);