import { DOMNode, TextWriter, cartesianProduct } from "@conjure/core";

export function fetchConfigName(cfg: DOMNode) {
    return `${cfg.configuration}_${cfg.platform}`
}

export function fetchConfigNames(wks: DOMNode) {
    const product = cartesianProduct([wks.configurations, wks.platforms]) as string[][];
    return product.map(([configuration, platform]: string[]) => {
        return `${configuration}_${platform}`;
    });
}

export function writeShell(_: DOMNode, file: TextWriter) {
    file.write('SHELLTYPE := posix');
    file.write('ifeq ($(shell echo \"test\"),\"test\")')
    file.indent();
    file.write('SHELLTYPE := msdos');
    file.outdent();
    file.write('endif');
    file.write('');
}