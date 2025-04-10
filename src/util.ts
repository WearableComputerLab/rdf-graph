import type * as N3 from "n3";

export type TTLData = {
    quads: N3.Quad[];
    prefixes: Record<string, string>;
};
