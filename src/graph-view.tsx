import React, { RefObject } from "react";
import * as N3 from "n3";
import ForceGraph, {
    ForceGraphMethods,
    LinkObject,
    NodeObject
} from "react-force-graph-2d";
import { TTLData } from "./util";
import { forceCollide } from "d3-force-3d";

type GraphViewProps = {
    data: TTLData;
};

type Node = {
    x?: number;
    y?: number;
    id: string;
    name: string;
    data: N3.Quad_Object;
    vx: number;
    vy: number;
    className: string | null;
};

type Link = {
    source: string;
    target: string;
    data: N3.Quad;
};

type GraphRef = ForceGraphMethods<
    NodeObject<Node>,
    LinkObject<Node, Link> | undefined
>;

function stripPrefix(name: string, prefixes: Record<string, string>): string {
    for (const [k, v] of Object.entries(prefixes)) {
        if (name.startsWith(v)) {
            name = `${k}:${name.substring(v.length)}`;
            break;
        }
    }

    return name;
}

function mkNode(data: N3.Quad_Object, prefixes: Record<string, string>): Node {
    let name = "?";

    if (data.termType === "NamedNode") {
        name = stripPrefix(data.value, prefixes);
    } else if (data.termType === "Literal") {
        name = "(Literal)";
    }

    return {
        id: data.id,
        name,
        data,
        vx: Math.random() * 2.0 - 1.0,
        vy: Math.random() * 2.0 - 1.0,
        className: null
    };
}

const LINE_HEIGHT = 16;

function getNodeSize(n: Node): [number, number] {
    let lines = 1;
    let len = n.name.length;

    if (n.className !== null) {
        lines++;
        len = Math.max(len, n.className.length);
    }

    return [len * 6 + 12, lines * LINE_HEIGHT + 8];
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

    if (n.className === null) {
        ctx.fillStyle = "white";
        ctx.fillText(n.name, x, y);
    } else {
        ctx.fillStyle = "#808080";
        ctx.fillText(n.className, x, y - LINE_HEIGHT * 0.5);
        ctx.fillStyle = "white";
        ctx.fillText(n.name, x, y + LINE_HEIGHT * 0.5);
    }
}

function pointerAreaPaint(
    n: NodeObject<Node>,
    color: string,
    ctx: CanvasRenderingContext2D
): void {
    const [width, height] = getNodeSize(n);
    ctx.fillStyle = color;
    ctx.fillRect(n.x! - width * 0.5, n.y! - height * 0.5, width, height);
}

const GraphView = React.memo(function GraphView({
    data
}: GraphViewProps): React.JSX.Element {
    const graphRef = React.useRef<GraphRef>(null);

    const graphData = React.useMemo(() => {
        const nodeMap = new Map<string, Node>();
        const types: N3.Quad[] = [];
        const links: Link[] = [];
        const prefixes = {
            ...data.prefixes,
            ex: "http://example.org/"
        };

        for (const q of data.quads) {
            if (
                q.predicate.value ===
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
            ) {
                types.push(q);
                continue;
            }

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

        for (const q of types) {
            const obj = nodeMap.get(q.subject.id);

            if (obj && q.object.termType === "NamedNode") {
                const cn = stripPrefix(q.object.value, prefixes);
                obj.className = `«${cn}»`;
            }
        }

        return {
            nodes: Array.from(nodeMap.values()),
            links
        };
    }, [data]);

    React.useEffect(() => {
        const graph = graphRef.current;
        if (!graph) {
            return;
        }

        graph.d3Force(
            "collide",
            forceCollide(n => {
                const [w, h] = getNodeSize(n as Node);
                return Math.max(w, h) * 0.5 + 5;
            })
        );

        graph.d3Force("charge", null);
    }, [graphData.nodes]);

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
                linkCurvature={0.1}
                ref={graphRef as RefObject<GraphRef>}
                cooldownTime={Number.POSITIVE_INFINITY}
            />
        </div>
    );
});

export default GraphView;
