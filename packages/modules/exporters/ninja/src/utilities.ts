import { DOMNode } from "@conjure/core";
import { extname, join, normalize, relative } from "path";

export const fileExtensionLanguageMap: any = {
    '.c': 'C',
    '.cc': 'C++',
    '.cpp': 'C++',
    '.cxx': 'C++',
    '.ixx': 'C++', // modules
    '.cppm': 'C++', // modules
};

export class Ninja {   
    static escape(str: string): string {
        return str.replace('%$', '$$').replace(':', '$:').replace('\n', '$\n').replace(' ', '$ ');
    }
    
    static quote(str: string): string {
        const contents = str.replace('\\', '\\\\').replace("'", "''").replace('"', '""');
        return `"${contents}"`;
    }
    
    static pathToProject(wks: DOMNode, node: DOMNode, name: string): string {
        const location = normalize(join(node.location, `${name}`));
        const path = relative(wks.location, location);
        return path;
    }

    static determineLanguage(file: string): string | undefined {
        const ext = extname(file);
        return fileExtensionLanguageMap[ext];
    }
}