import { DOMNode, ExporterArguments, TextWriter } from "@conjure/core";
import { join, normalize, relative, resolve } from "path";
import { cppproj } from "./cppproj";

const projectExporterMapper: any = {
    'C': cppproj,
    'C++': cppproj
};

function writeHeader(wks: DOMNode, _args: ExporterArguments, writer: TextWriter) {
    writer.write(`# Generated by Conjure`);
    writer.write(`# Workspace: ${wks.getName()}`);
    writer.write('');
}

function writeProjects(wks: DOMNode, config: string, platform: string, _args: ExporterArguments, writer: TextWriter) {
    const projects = wks.getAllNodes().filter(node => node.apiName === 'project');

    writer.write('# Projects')
    projects.forEach(prj => {
        const name = prj.getName();
        const location = normalize(join(prj.location, `${name}_${config}_${platform}.ninja`));
        const path = relative(wks.location, location);
        prj.__fullpath = resolve(path);
        prj.__wks = wks;

        writer.write(`include ${path}`);
    });

    writer.write('');
}

export function workspace(wks: DOMNode, args: ExporterArguments) {
    const configs: string[] = wks.configurations;
    const platforms: string[] = wks.platforms;

    configs.forEach(config => {
        platforms.forEach(platform => {
            const filename = `${wks.getName()}_${config}_${platform}.ninja`;
            const wksFileLocation = join(wks.location, filename);
            const file = new TextWriter(wksFileLocation);
            writeHeader(wks, args, file);
            writeProjects(wks, config, platform, args, file);
            file.close();

            const projects = wks.getAllNodes().filter(node => node.apiName === 'project');
            
            projects.forEach(prj => {
                const exporter = projectExporterMapper[prj.language];
                if (exporter) {
                    const cfg = prj.getChildren().filter(when => {
                        return when.configuration === config && when.platform === platform
                    });

                    if (!cfg) {
                        throw new Error(`Failed to find filter node for ${config}:${platform}`);
                    }

                    exporter(prj, cfg[0], args);
                }
            });
        });
    });
}