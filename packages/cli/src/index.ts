import { requestBuild } from "@conjure/build";
import { bake, BakeArgs, ExporterRegistry, filterMatch, Host, include, includeFileStack, pathToWorkspace, State } from "@conjure/core";
import { command } from "cmd-ts";
import { File } from "cmd-ts/batteries/fs";
import { boolean, flag } from "cmd-ts/dist/cjs/flag";
import { option } from "cmd-ts/dist/cjs/option";
import { positional } from "cmd-ts/dist/cjs/positional";
import { run } from "cmd-ts/dist/cjs/runner";
import { string } from "cmd-ts/dist/cjs/types";
import { dirname } from "path";

// Load all the core modules
require("@conjure/ninja");
require("@conjure/vstudio");
require("@conjure/clang");
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
        }),
        build: flag({
            long: 'build',
            short: 'b',
            description: 'Build the project after configuring it',
        }),
        noExport: flag({
            long: 'no-export',
            short: 'n',
            description: 'Do not export the project files. This is only valid if --build is also specified.',
        }),
    },
    handler: ({ exporterName, scriptPath, system, architecture, build, noExport }) => {
        try {
            // Execute the conjure configuration script
            const filepath = scriptPath;
            include(filepath);

            // Validate the exporter chosen.  This must be done after loading the configuration script in case
            // the configuration script loads an exporter.

            const exporter = ExporterRegistry.get().fetch(exporterName);
            if (!exporter) {
                throw new Error(`Could not find exporter with name ${exporterName}`);
            }

            const bakeArgs: BakeArgs = {
                system,
                architecture,
                exporter: exporterName
            };

            // Bake the configuration state into a format the exporters can use
            bake(State.get(), bakeArgs);

            const rootPath = dirname(filepath);
            includeFileStack.push(rootPath);

            // Process on configure commands
            const onConfigureCommands = State.get().peek()?.onConfigureCommands || [];
            for (const command of onConfigureCommands) {
                command();
            }

            for (const filter of State.get().peek()?.configFilters || []) {
                if (!filterMatch(filter, { platform: '', configuration: '', system: bakeArgs.system, architecture: bakeArgs.architecture, toolset: '', exporter: exporterName })) {
                    continue;
                }

                const ctx = {
                    system: bakeArgs.system,
                    architecture: bakeArgs.architecture,
                    pathToWorkspace: pathToWorkspace(State.get().peek()!),
                };

                filter.callback(ctx);
            }

            includeFileStack.pop();

            if (noExport && !build) {
                console.warn('The --no-export flag is only valid if --build is also specified. Ignoring --no-export flag.');
            }

            if (!noExport || !build) {
                // Use the selected exporter to write the state to file(s)
                exporter.functor(State.get(), {
                    name: exporterName,
                    version: "2022"
                });
            }

            if (build) {
                requestBuild({
                    exporter: exporter,
                    args: {
                        name: exporterName,
                        version: "2022"
                    },
                    state: State.get()
                });
            }
        } catch (err) {
            console.error(err);
        }
    },
    version: '1.0.0'
});

run(app, process.argv.slice(2));