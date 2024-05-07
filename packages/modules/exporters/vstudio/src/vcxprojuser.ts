import { DOMNode, ExporterArguments, XmlWriter } from "@conjure/core";
import { join } from "path";

export type VcxProjUserFunc = (prj: DOMNode, writer: XmlWriter) => void;

function writeDebuggerSettings(prj: DOMNode, writer: XmlWriter) {
    prj.getChildren().filter((node) => node.apiName === 'when').forEach((node) => {
        writer.writeNode("PropertyGroup", { Condition: `'$(Configuration)|$(Platform)'=='${node.configuration}|${node.platform}'` }, () => {
            if (node.debugDirectory) {
                writer.writeContentNode('LocalDebuggerWorkingDirectory', {}, node.debugDirectory);
            }

            const debuggerType = node.debuggerType || 'WindowsLocalDebugger';
            writer.writeContentNode('DebuggerFlavor', {}, debuggerType);
        });
    });
}

export const functionArray: Array<VcxProjUserFunc> = [
    writeDebuggerSettings
];

export function vcxprojuser(prj: DOMNode, _: ExporterArguments) {
    if (prj.apiName !== 'project') {
        throw new Error(`[vstudio] Expected DOMNode of scope project. Received DOMNode of type ${prj.apiName}.`);
    }

    const prjFileLocation = join(prj.location, `${prj.getName()}.vcxproj.user`);
    const file = new XmlWriter(prjFileLocation);

    file.writeNode("Project", { ToolsVersion: "Current", xmlns: "http://schemas.microsoft.com/developer/msbuild/2003" }, () => {
        functionArray.forEach((fn) => fn(prj, file));
    });

    file.close();
}