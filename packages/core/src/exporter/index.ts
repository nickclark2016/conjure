import { State } from "../state";

export interface ExporterArguments {
    name: string;
    version: string;
};

export type Builder = {
    functor: (state: State, args: ExporterArguments) => Promise<boolean>;
};

export type Exporter = {
    name: string;
    functor: (state: State, args: ExporterArguments) => void;
    builder?: Builder;
};

export class ExporterRegistry {
    private static _instance: ExporterRegistry = new ExporterRegistry();

    private readonly _exporters: Map<String, Exporter> = new Map();

    static get(): ExporterRegistry {
        return ExporterRegistry._instance;
    }

    static set(registry: ExporterRegistry) {
        ExporterRegistry._instance = registry;
    }

    register(exporter: Exporter) {
        this._exporters.set(exporter.name, exporter);
    }

    fetch(name: string): Exporter | null {
        return this._exporters.get(name) || null;
    }

    remove(name: string): boolean {
        return this._exporters.delete(name);
    }

    all(): ReadonlySet<Exporter> {
        return new Set(this._exporters.values());
    }
};