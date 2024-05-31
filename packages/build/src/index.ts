import { Exporter, ExporterArguments, ExporterRegistry, State } from "@conjure/core";

export type BuildArgs = {
    exporter: Exporter | undefined;
    args: ExporterArguments;
    state: State;
};

function getExporterChain(exporter: Exporter | undefined): Exporter[] {
    let exporters = Array.from(ExporterRegistry.get().all()).filter(e => e.builder !== undefined);

    if (exporter) {
        exporters = exporters.filter(e => e !== exporter);
        exporters.unshift(exporter);
    }

    return exporters;
}

export async function requestBuild(args: BuildArgs) {
    console.log(`Building project with exporter ${args.exporter?.name}`);

    const exporters = getExporterChain(args.exporter);
    if (exporters.length === 0) {
        throw new Error("No exporters found");
    }

    let built = false;

    for (const exporter of exporters) {
        const builder = exporter.builder;
        if (!builder) {
            continue;
        }

        const build = await builder.functor(args.state, args.args);
        if (build) {
            built = true;
            break;
        }
    }

    if (!built) {
        throw new Error("Failed to build project");
    }

    console.log("Project built successfully");
}