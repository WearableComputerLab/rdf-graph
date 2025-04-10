import React from "react";
import * as N3 from "n3";
import { TTLData } from "./util";

type TTLInputProps = {
    setData: (data: TTLData) => unknown;
};

const STORAGE_KEY = "lastRDFData";

const TTLInput = React.memo(function TTLInput({
    setData
}: TTLInputProps): React.JSX.Element {
    const [source, setSource] = React.useState(() => {
        const item = localStorage.getItem(STORAGE_KEY);
        return item ?? "";
    });

    const inputRef = React.useRef<HTMLTextAreaElement>(null);

    const visualise = React.useCallback(
        (data: string) => {
            localStorage.setItem(STORAGE_KEY, data);

            const parser = new N3.Parser();
            const quads: N3.Quad[] = [];
            const prefixes: Record<string, string> = {};

            parser.parse(data, (_err, q, p) => {
                if (q) {
                    quads.push(q);
                }

                if (p) {
                    for (const [k, v] of Object.entries(p)) {
                        if (typeof v === "string") {
                            prefixes[k] = v;
                        }
                    }
                }
            });

            setData({
                quads,
                prefixes
            });
        },
        [setData]
    );

    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-5">
            <h1>Paste your TTL code here</h1>
            <textarea
                className="rounded-md bg-gray-800 border hover:border-blue-700 focus:border-blue-700 shadow-lg shadow-[rgba(0,0,0,0.25)] p-2 outline-none transition-colors"
                value={source}
                onInput={ev => setSource(ev.currentTarget.value)}
                rows={20}
                cols={150}
                ref={inputRef}
            ></textarea>
            <button
                className="rounded-md px-4 py-2 font-bold bg-white bg-opacity-10 hover:bg-opacity-20 cursor-pointer"
                onClick={() => visualise(source)}
            >
                Visualise
            </button>
        </div>
    );
});

export default TTLInput;
