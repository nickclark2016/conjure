import { APIAcceptedTypes, APIInfo, APIRegistry } from "../api";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { get } from "https";
import { basename, join } from "path";
import StreamZip from "node-stream-zip";
import { includeFileStack } from "../include";

type FetchRemoteZipArgs = {
    url?: string,
    files: string[],
    destination?: string
};

async function processZipFile(args: FetchRemoteZipArgs, zipPath: string) {
    console.log(`Processing zip file ${zipPath}`);
    console.log(`Files to extract: ${args.files.join(', ')}`);
    console.log(`Destination: ${args.destination || '.'}`);

    const zip = new StreamZip.async({ file: zipPath });

    if (args.destination && !existsSync(args.destination)) {
        mkdirSync(args.destination, { recursive: true });
    }

    if (!args.files || args.files.length === 0) {
        console.log(`Extracting all files from ${zipPath} to ${args.destination || '.'}`);
        await zip.extract(null, args.destination || '.');
    } else {
        await Promise.all(args.files.map(async (file) => {
            const dest = args.destination ? `${args.destination}/${basename(file)}` : file;
            console.log(`Extracting ${file} to ${dest}`);
            await zip.extract(file, dest);
        }));
    }

    
}

const fetchRemoteZipApiInfo: APIInfo = {
    name: 'fetchRemoteZip',
    accepts: APIAcceptedTypes.Object,
    expectedArgumentCount: 1,
    allowedInScopes: ['onConfigure'],
    acceptedArguments: [],
    action: (args: FetchRemoteZipArgs) => {
        const baseDir = includeFileStack[includeFileStack.length - 1];

        if (args.url === undefined) {
            throw new Error(`fetchRemoteZip requires a URL to fetch from.`);
        }

        const outputDir = join(baseDir, './ConjureCache/');

        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }

        const filename = join(outputDir, basename(args.url));

        if (existsSync(filename)) {
            console.log(`File ${filename} already exists. Skipping download.`);
            processZipFile(args, filename);
            return;
        }

        console.log(`Downloading ${args.url} to ${filename}`);

        const updatedArgs: FetchRemoteZipArgs = {
            ...args,
            destination: join(baseDir, args.destination || '.')
        };

        if (updatedArgs.url === undefined) {
            throw new Error(`fetchRemoteZip requires a URL to fetch from.`);
        }

        get(updatedArgs.url, (res) => {
            if (res.statusCode === 302) {
                if (res.headers.location) {
                    const stream = createWriteStream(filename);

                    get(res.headers.location, (res) => {
                        if (res.statusCode !== 200) {
                            throw new Error(`Failed to download ${updatedArgs.url}. Received status code ${res.statusCode}`);
                        }

                        res.pipe(stream);

                        stream.on('finish', () => {
                            stream.close();
                            console.log(`Finished downloading ${updatedArgs.url}`);
                            processZipFile(updatedArgs, filename);
                        });
                    });
                } else {
                    throw new Error(`Redirected to a 302 status code without a location header.`);
                }
            } else {
                const stream = createWriteStream(filename);
                res.pipe(stream);

                stream.on('finish', () => {
                    stream.close();
                    console.log(`Finished downloading ${updatedArgs.url}`);
                    processZipFile(updatedArgs, filename);
                });
            }
        });
    }
};

APIRegistry.get().register(fetchRemoteZipApiInfo);