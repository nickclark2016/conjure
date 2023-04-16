import { bake, BakeArgs, ExporterRegistry, Host, include, State } from "@conjure/core";
import { command } from "cmd-ts";
import { File } from "cmd-ts/batteries/fs";
import { option } from "cmd-ts/dist/cjs/option";
import { positional } from "cmd-ts/dist/cjs/positional";
import { run } from "cmd-ts/dist/cjs/runner";
import { string } from "cmd-ts/dist/cjs/types";
import { dirname } from "path";

// Load all the core modules
require("@conjure/makefile");
require("@conjure/vstudio");
require("@conjure/clang");
require("@conjure/gcc");
require("@conjure/msc");

const app = command({
    name: 'conjure',
    args: {
        exporterName: positional({
            type: string,
            displayName: 'Exporter Name'
        }),
        scriptPath: option({
            type: File,
            long: 'script-path',
            short: 'p',
            description: 'Path from the current working directory to the Conjure script to execute',
            defaultValue: () => './conjure.js'
        }),
        system: option({
            type: string,
            long: 'system',
            short: 's',
            description: 'System type override for conjure script filters',
            defaultValue: () => Host.system()
        }),
        architecture: option({
            type: string,
            long: 'architecture',
            short: 'a',
            description: 'Architecture type override for conjure script filters',
            defaultValue: () => Host.architecture()
        })
    },
    handler: ({ exporterName, scriptPath, system, architecture }) => {
        try {
            // Execute the conjure configuration script
            const filepath = scriptPath;
            include(filepath);

            const root = State.get().peek();
            if (root) {
                root.location = dirname(scriptPath);
            }

            // Validate the exporter chosen.  This must be done after loading the configuration script in case
            // the configuration script loads an exporter.

            const exporter = ExporterRegistry.get().fetch(exporterName);
            if (!exporter) {
                throw new Error(`Could not find exporter with name ${exporterName}`);
            }

            const bakeArgs: BakeArgs = {
                system,
                architecture
            };

            // Bake the configuration state into a format the exporters can use
            bake(State.get(), bakeArgs);

            // Use the selected exporter to write the state to file(s)
            exporter.functor(State.get(), {
                name: exporterName,
                version: "2022",
                system: Host.system()
            });
        } catch (err) {
            console.log(err);
        }
    },
    version: '1.0.0'
});

run(app, process.argv.slice(2));