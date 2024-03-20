import { APIAcceptedTypes, APIRegistry } from "../api";
import { State } from "../state";

export type OnConfigureCallback = () => void;

APIRegistry.get().register({
    name: 'onConfigure',
    accepts: APIAcceptedTypes.Function,
    expectedArgumentCount: 1,
    allowedInScopes: ['root'],
    acceptedArguments: [],
    action: (callback: OnConfigureCallback) => {
        const node = State.get().peek();
        if (!node) {
            throw new Error(`DOM state null.`);
        }

        const isValid = node.apiName === 'root' || node.apiName === 'when';

        if (!isValid) {
            throw new Error(`Scope API onConfigure not defined in scope ${node.getParent()?.apiName || '[unknown scope]'}`);
        }

        if (node.onConfigureCommands === undefined) {
            node.onConfigureCommands = [];
        }

        node.onConfigureCommands.push(callback);
    }
});