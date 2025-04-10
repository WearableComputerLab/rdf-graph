import React from "react";
import TTLInput from "./ttl-input";
import GraphView from "./graph-view";
import { TTLData } from "./util";

const App = React.memo(function App(): React.JSX.Element {
    const [data, setData] = React.useState<TTLData | null>(null);

    return (
        <div className="w-full h-full from-teal-950 to-blue-950 bg-gradient-to-tl overflow-clip text-white">
            {data === null && <TTLInput setData={setData} />}
            {data !== null && <GraphView data={data} />}
        </div>
    );
});

export default App;
