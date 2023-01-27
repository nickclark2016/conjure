import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const filesApiInfo: FieldAPIInfo = {
    name: 'files',
    accepts: APIAcceptedTypes.Set(APIAcceptedTypes.String),
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Merge,
    inherited: false,
    isFiles: true
};

FieldRegistry.get().register(filesApiInfo);