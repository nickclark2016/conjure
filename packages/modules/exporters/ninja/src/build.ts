import { ExporterArguments, Host, State, System, cartesianProduct } from "@conjure/core";
import { exec } from "child_process";
import { homedir } from "os";
import { join } from "path";
import { stat } from "fs/promises";
import { text } from "stream/consumers";

const vswherePath = "C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe";

type VSInstallData = {
    path: string;
    productLineVersion: string;
};

export async function build(state: State, args: ExporterArguments): Promise<boolean> {
    // Check all projects to see if toolset is msc
    const root = state.peek();
    if (!root) {
        throw new Error(`[ninja] Root state must be defined.`);
    }

    const projects = root.getAllNodes().filter((node) => node.apiName === 'project');
    const anyMsc = projects.some(project => {
        const toolset = project.toolset;
        return toolset !== undefined && (toolset === 'msc' || toolset.startsWith('msc:'));
    });

    let vsdevcmdPath: string | undefined = undefined;
    const requiresMsc = anyMsc && Host.system() === System.Windows;

    if (requiresMsc) {
        // Check if vswhere exists
        const vsWhereExists = await stat(vswherePath).then(() => true).catch(() => false);
        if (!vsWhereExists) {
            console.log(`Failed to find vswhere.exe at ${vswherePath}`);
            return false;
        }

        // Determine VS version to use
        const version = args.version;

        // Get the VS install locations
        const { stdout } = exec(`"${vswherePath}" -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64`);

        if (stdout) {
            // Chunk the output by single empty lines
            const stdoutText = await text(stdout);

            // Split chunks into individual VS Install Objects
            const chunks = stdoutText.split("\r\n\r\n").filter((chunk) => chunk.length > 0);

            if (chunks.length === 0) {
                console.log(`Failed to find Visual Studio installation`);
                return false;
            }

            // Parse each chunk as a VS Install Object
            const installs = chunks.map((chunk) => {
                const lines = chunk.split("\r\n");
                const install: VSInstallData = {
                    path: "",
                    productLineVersion: ""
                };

                lines.forEach((line) => {
                    if (line.startsWith("installationPath: ")) {
                        install.path = line.replace("installationPath: ", "");
                    } else if (line.startsWith("catalog_productLineVersion: ")) {
                        install.productLineVersion = line.replace("catalog_productLineVersion: ", "");
                    }
                });

                if (install.path === "" || install.productLineVersion === "") {
                    return undefined;
                }

                return install;
            }).filter((install) => install !== undefined) as VSInstallData[];

            // If the version is not specified, use the highest version. If the version is specified, match it.
            const install = (() => {
                if (version) {
                    return installs.find((i) => i.productLineVersion.includes(version));
                } else {
                    const sorted = installs.sort((a, b) => {
                        return parseInt(a.productLineVersion) - parseInt(b.productLineVersion);
                    });

                    return sorted[sorted.length - 1];
                }
            })();

            if (!install) {
                console.log(`Failed to find Visual Studio installation`);
                return false;
            }

            vsdevcmdPath = `"${install.path}\\Common7\\Tools\\VsDevCmd.bat"`;
        }
    }

    if (requiresMsc && !vsdevcmdPath) {
        console.log(`Failed to find Visual Studio installation`);
        return false;
    }

    // Check if ninja is on path
    const { stdout: ninjaLocStdout } = Host.system() === System.Windows ? exec('where ninja') : exec('which ninja');
    if (!ninjaLocStdout) {
        console.log('Failed to find ninja on path');
        return false;
    }

    const ninjaLocStdoutContent = await text(ninjaLocStdout);

    let ninjaPath = 'ninja';

    if (ninjaLocStdoutContent.length === 0 && Host.system() === System.Windows) {
        // Check again, but this time at hard path C:\User\UserName\bin
        const absoluteNinjaPath = join(homedir(), 'bin', 'ninja.exe');
        const ninjaExists = await stat(absoluteNinjaPath).then(() => true).catch(() => false);
        if (!ninjaExists) {
            console.log(`Failed to find ninja at ${absoluteNinjaPath}`);
            return false;
        }
        ninjaPath = `"${absoluteNinjaPath}"`;
    } else if (ninjaLocStdoutContent.startsWith("which: no ninja in")) {
        console.log('Failed to find ninja on path');
        return false;
    } else {

    }

    // Iterate over all of the workspaces and build them
    const workspaces = root.getAllNodes().filter((node) => node.apiName === 'workspace');

    for (const wks of workspaces) {
        const workspacePath = join(`${wks.getName()}.ninja`);

        const cfgs = wks.configurations;
        const platforms = wks.platforms;

        for (const [cfg, platform] of cartesianProduct([cfgs, platforms])) {
            const buildcommands = [];
            if (requiresMsc) {
                if (platform === 'x64') {
                    buildcommands.push(`${vsdevcmdPath} -arch=x64 -host_arch=x64`);
                } else {
                    buildcommands.push(`${vsdevcmdPath} -arch=x86 -host_arch=x86`);
                }
            }

            buildcommands.push(`${ninjaPath} -v -f ${workspacePath} ${cfg}_${platform}`);

            // Join commands into a single command
            const command = buildcommands.join(" && ");

            console.log(`Building configuration ${cfg} and platform ${platform} for workspace ${wks.getName()}`);

            // Execute the command
            const { stdout, stderr } = exec(command);
            if (stderr) {
                const errorOutput = await text(stderr);
                if (errorOutput) {
                    console.error(errorOutput);
                    return false;
                }
            }

            if (stdout) {
                text(stdout).then((output) => {
                    if (output) {
                        console.log(output);
                    }
                });
            }

            console.log(`Build succeeded for configuration ${cfg} and platform ${platform}`);
        }
    }

    return true;
}