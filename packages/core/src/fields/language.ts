import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const languageApiInfo: FieldAPIInfo = {
    name: 'language',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: false,
    isFiles: false
};

const languageVersionApiInfo: FieldAPIInfo = {
    name: 'languageVersion',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: false,
    isFiles: false
};

FieldRegistry.get().register(languageApiInfo);
FieldRegistry.get().register(languageVersionApiInfo);
