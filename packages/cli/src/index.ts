import { bake, ExporterRegistry, include, State } from "@premake-core/core";
import { command } from "cmd-ts";
import { File } from "cmd-ts/batteries/fs";
import { option } from "cmd-ts/dist/cjs/option";
import { positional } from "cmd-ts/dist/cjs/positional";
import { run } from "cmd-ts/dist/cjs/runner";
import { string } from "cmd-ts/dist/cjs/types";

// Load all the core modules
require("@premake-core/vstudio");
require("@premake-core/clang");
require("@premake-core/msc");

const app = command({
    name: 'premake',
    args: {
        exporterName: positional({
            type: string,
            displayName: 'Exporter Name'
        }),
        scriptPath: option({
            type: File,
            long: 'script-path',
            short: 's',
            description: 'Path from the current working directory to the Premake script to execute',
            defaultValue: () => './premake6.js'
        })
    },
    handler: ({ exporterName, scriptPath }) => {
        try {
            // Execute the premake configuration script
            const filepath = scriptPath;
            include(filepath);

            // Validate the exporter chosen.  This must be done after loading the configuration script in case
            // the configuration script loads an exporter.

            const exporter = ExporterRegistry.get().fetch(exporterName);
            if (!exporter) {
                throw new Error(`Could not find exporter with name ${exporterName}`);
            }

            // Bake the configuration state into a format the exporters can use
            bake(State.get());

            // Use the selected exporter to write the state to file(s)
            exporter.functor(State.get(), {
                name: exporterName,
                version: "2022"
            });
        } catch (err) {
            console.log(err);
        }
    },
    version: '1.0.0'
});

run(app, process.argv.slice(2));