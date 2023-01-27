import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const targetDirApiInfo: FieldAPIInfo = {
    name: 'targetDirectory',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true,
    isFiles: true
};

FieldRegistry.get().register(targetDirApiInfo);