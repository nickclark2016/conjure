import { bake, ExporterRegistry, include, State } from "@premake-core/core";

// Load all the core modules
require("@premake-core/vstudio")
require("@premake-core/msc")

// Execute the premake configuration script
const filepath = './examples/premake6.js';
const domState = include(filepath);

// Validate the exporter chosen.  This must be done after loading the configuration script in case
// the configuration script loads an exporter.

const exporterName = 'vstudio'; // TODO: Load from CLI arguments
const exporter = ExporterRegistry.get().fetch(exporterName);
if (!exporter) {
    throw new Error(`Could not find exporter with name ${exporterName}`);
}


// Bake the configuration state into a format the exporters can use
bake(State.get());

// Use the selected exporter to write the state to file(s)
exporter.functor(domState, {
    name: exporterName,
    version: "2022"
});