import { APIAcceptedType, APIAcceptedTypeContainer } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const platformApiInfo: FieldAPIInfo = {
    name: 'platforms',
    accepts: {
        container: APIAcceptedTypeContainer.Set,
        type: APIAcceptedType.String
    },
    expectedArgumentCount: 1,
    allowedInScopes: ['workspace', 'project'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Merge
};

FieldRegistry.register(platformApiInfo);