import { ExporterArguments, State, cartesianProduct } from "@conjure/core";
import { exec } from "child_process";
import { join } from "path";
import { stat } from "fs/promises";
import { text } from "stream/consumers";

const vswherePath = "C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe";

type VSInstallData = {
    path: string;
    productLineVersion: string;
};

export async function build(state: State, args: ExporterArguments): Promise<boolean> {
    const vsWhereExists = await stat(vswherePath).then(() => true).catch(() => false);

    if (!vsWhereExists) {
        console.log(`Failed to find vswhere.exe at ${vswherePath}`);
        return false;
    }

    // Determine VS version to use
    const version = args.version;

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

        // Find the build tools for the project
        const msbuildPath = `${install.path}\\MSBuild\\Current\\Bin\\amd64\\MSBuild.exe`;

        console.log(`Building project with Visual Studio ${install.productLineVersion} at ${install.path}`);
        console.log(`Using MSBuild at ${msbuildPath}`);

        // Ensure msbuild exists
        const msbuildExists = await stat(msbuildPath).then(() => true).catch(() => false);
        if (!msbuildExists) {
            console.log(`Failed to find MSBuild at ${msbuildPath}`);
            return false;
        }

        // Gather all workspaces in the state
        const root = state.peek();
        if (!root) {
            console.log(`Failed to find root state`);
            return false;
        }

        const children = root.getChildren();
        const workspaces = children.filter((wks) => wks.apiName === 'workspace');

        if (workspaces.length === 0) {
            console.log(`Failed to find any workspaces`);
            return false;
        }

        // Build each workspace
        for (const wks of workspaces) {
            // Get path to workspace from current working directory
            const workspacePath = join(wks.location, `${wks.getName()}.sln`);

            // Determine which configuration(s) and platform(s) to build
            const cfgs = wks.configurations;
            const platforms = wks.platforms;

            // Build each configuration and platform
            for (const [cfg, platform] of cartesianProduct([cfgs, platforms])) {
                console.log(`Building configuration ${cfg} and platform ${platform} for workspace ${wks.getName()}`);

                // Build the project and check for errors
                const { stdout, stderr } = exec(`"${msbuildPath}" "${workspacePath}" /p:Configuration=${cfg} /p:Platform=${platform}`);

                // Check output of stderr for "n Error(s)"
                if (stderr) {
                    const errorOutput = await text(stderr);
                    // Find line with "Error(s)"
                    const errorLine = errorOutput.split("\n").find((line) => line.includes("Error(s)"));
                    if (errorLine) {
                        // Line is in form X Error(s), so split by space and get first element
                        const errorCount = errorLine.split(" ")[0];
                        if (errorCount !== "0") {
                            console.log(`Build failed with ${errorCount} errors`);
                            return false;
                        }
                    }
                }

                if (stdout) {
                    text(stdout).then((output) => console.log(output));
                }

                // Build for configuration and platform succeeded
                console.log(`Build succeeded for configuration ${cfg} and platform ${platform}`);
            }
        }

        return true;
    }

    return false;
}