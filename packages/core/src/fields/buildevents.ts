import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const preBuildEventsInfo: FieldAPIInfo = {
    name: 'preBuildEvents',
    accepts: APIAcceptedTypes.List(APIAcceptedTypes.String),
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Merge,
    inherited: true,
    isFiles: false
};

const preLinkEvents: FieldAPIInfo = {
    name: 'preLinkEvents',
    accepts: APIAcceptedTypes.List(APIAcceptedTypes.String),
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Merge,
    inherited: true,
    isFiles: false
};

const postLinkEventsInfo: FieldAPIInfo = {
    name: 'postBuildEvents',
    accepts: APIAcceptedTypes.List(APIAcceptedTypes.String),
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when', 'block'],
    acceptedArguments: [],
    acceptBehavior: APIBehaviorOnAccept.Merge,
    inherited: true,
    isFiles: false
};

FieldRegistry.get().register(preBuildEventsInfo);
FieldRegistry.get().register(preLinkEvents);
FieldRegistry.get().register(postLinkEventsInfo);