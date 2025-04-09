import React from "react";
import * as N3 from "n3";

const App = React.memo(function App(): React.JSX.Element {
    const [source, setSource] = React.useState("");

    const visualise = React.useCallback((data: string) => {
        const parser = new N3.Parser();
        const quads = parser.parse(data);

        console.log(quads);
    }, []);

    return (
        <div className="w-full h-full from-teal-950 to-blue-950 bg-gradient-to-tl flex flex-col items-center justify-center overflow-clip text-white gap-5">
            <h1>Hello there!</h1>
            <textarea
                className="rounded-md bg-gray-800 border border-blue-700 shadow-lg shadow-[rgba(0,0,0,0.25)] p-1 outline-none"
                value={source}
                onInput={ev => setSource(ev.currentTarget.value)}
                rows={20}
                cols={150}
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

export default App;
