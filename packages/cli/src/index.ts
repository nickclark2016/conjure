import { APIRegistry } from "@premake-core/core";
import { Code, Environment } from "./runtime";

const filepath = './premake6.js';

Code.fromJavascriptFile(filepath).then((code) => {
    const env = new Environment(APIRegistry.fetchApiTable());
    env.execute(code);
}).catch((err) => {
    console.error(err);
});