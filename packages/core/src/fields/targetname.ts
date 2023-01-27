import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const targetNameApiInfo: FieldAPIInfo = {
    name: 'targetName',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true,
    isFiles: false
};

FieldRegistry.get().register(targetNameApiInfo);