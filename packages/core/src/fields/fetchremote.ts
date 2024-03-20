import { APIAcceptedTypes, APIInfo, APIRegistry } from "../api";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { get } from "https";
import { basename } from "path";
import StreamZip from "node-stream-zip";

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
        mkdirSync(args.destination);
    }

    if (!args.files || args.files.length === 0) {
        // Extract all files
        await zip.extract(null, args.destination || '.');
    } else {
        await Promise.all(args.files.map(async (file) => {
            const dest = args.destination ? `${args.destination}/${basename(file)}` : file;
            console.log(`Extracting ${file} to ${dest}`);
            await zip.extract(file, dest);
        }));
    }

    
}

const fetchRemoteApiInfo: APIInfo = {
    name: 'fetchRemoteZip',
    accepts: APIAcceptedTypes.Object,
    expectedArgumentCount: 1,
    allowedInScopes: ['onConfigure'],
    acceptedArguments: [],
    action: (args: FetchRemoteZipArgs) => {
        if (args.url === undefined) {
            throw new Error(`fetchRemoteZip requires a URL to fetch from.`);
        }

        const filename = basename(args.url);

        if (existsSync(filename)) {
            console.log(`File ${filename} already exists. Skipping download.`);
            processZipFile(args, filename);
            return;
        }

        console.log(`Downloading ${args.url} to ${filename}`);

        get(args.url, (res) => {
            if (res.statusCode === 302) {
                if (res.headers.location) {
                    const stream = createWriteStream(filename);

                    get(res.headers.location, (res) => {
                        if (res.statusCode !== 200) {
                            throw new Error(`Failed to download ${args.url}. Received status code ${res.statusCode}`);
                        }

                        res.pipe(stream);

                        stream.on('finish', () => {
                            stream.close();
                            console.log(`Finished downloading ${args.url}`);
                            processZipFile(args, filename);
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
                    console.log(`Finished downloading ${args.url}`);
                    processZipFile(args, filename);
                });
            }
        });
    }
};

APIRegistry.get().register(fetchRemoteApiInfo);