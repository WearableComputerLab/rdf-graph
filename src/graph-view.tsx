import React from "react";
import * as N3 from "n3";
import ForceGraph, { NodeObject } from "react-force-graph-2d";
import { TTLData } from "./util";

type GraphViewProps = {
    data: TTLData;
};

type Node = {
    id: string;
    name: string;
    data: N3.Quad_Object;
};

type Link = {
    source: string;
    target: string;
    data: N3.Quad;
};

function mkNode(data: N3.Quad_Object, prefixes: Record<string, string>): Node {
    let name = "?";

    if (data.termType === "NamedNode") {
        name = data.value;

        for (const [k, v] of Object.entries(prefixes)) {
            if (name.startsWith(v)) {
                name = `${k}:${name.substring(v.length)}`;
                break;
            }
        }
    }

    return {
        id: data.id,
        name,
        data
    };
}

function getNodeSize(n: Node): [number, number] {
    return [n.name.length * 6 + 12, 24];
}

function renderNode(n: NodeObject<Node>, ctx: CanvasRenderingContext2D): void {
    const x = n.x!;
    const y = n.y!;

    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const [width, height] = getNodeSize(n);
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.roundRect(x - width * 0.5, y - height * 0.5, width, height, 5);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.fillText(n.name, x, y);
}

function pointerAreaPaint(
    n: NodeObject<Node>,
    color: string,
    ctx: CanvasRenderingContext2D
): void {
    const [width, height] = getNodeSize(n);
    ctx.fillStyle = color;
    ctx.fillRect(n.x! - width * 0.5, n.y! - height, width, height);
}

const GraphView = React.memo(function GraphView({
    data
}: GraphViewProps): React.JSX.Element {
    const graphData = React.useMemo(() => {
        const nodeMap = new Map<string, Node>();
        const links: Link[] = [];
        const prefixes = {
            ...data.prefixes,
            ex: "http://example.org/"
        };

        for (const q of data.quads) {
            let subject = nodeMap.get(q.subject.id);
            if (!subject) {
                subject = mkNode(q.subject, prefixes);
                nodeMap.set(subject.id, subject);
            }

            let object = nodeMap.get(q.object.id);
            if (!object) {
                object = mkNode(q.object, prefixes);
                nodeMap.set(object.id, object);
            }

            links.push({
                source: subject.id,
                target: object.id,
                data: q
            });
        }

        return {
            nodes: Array.from(nodeMap.values()),
            links
        };
    }, [data]);

    return (
        <div className="w-full h-full">
            <ForceGraph
                graphData={graphData}
                nodeCanvasObject={renderNode}
                nodePointerAreaPaint={pointerAreaPaint}
                linkColor={() => "rgba(255, 255, 255, 0.25)"}
                linkWidth={2}
                linkDirectionalArrowLength={10}
                linkDirectionalArrowRelPos={1.0}
            />
        </div>
    );
});

export default GraphView;
