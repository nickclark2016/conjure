import { APIAcceptedTypes } from "../api";
import { APIBehaviorOnAccept, FieldAPIInfo, FieldRegistry } from "./fields";

const kindApiInfo: FieldAPIInfo = {
    name: 'kind',
    accepts: APIAcceptedTypes.String,
    expectedArgumentCount: 1,
    allowedInScopes: ['project', 'when'],
    acceptedArguments: [ 'ConsoleApp', 'StaticLib', 'SharedLib' ],
    acceptBehavior: APIBehaviorOnAccept.Replace,
    inherited: true
};

FieldRegistry.get().register(kindApiInfo);