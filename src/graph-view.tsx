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
    longestLinkLength: number;
};

type Link = {
    source: string;
    target: string;
    data: N3.Quad;
    name: string;
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
        className: null,
        longestLinkLength: 0
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

export function boxCollision(
    w: number,
    h: number,
    dx: number,
    dy: number
): number {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    return Math.min((w * 0.5) / ax, (h * 0.5) / ay);
}

function renderLink(
    l: LinkObject<Node, Link>,
    ctx: CanvasRenderingContext2D
): void {
    const s = l.source as Node;
    const t = l.target as Node;

    if (typeof s !== "object" || typeof t !== "object") {
        return;
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.lineJoin = "bevel";

    const [sw, sh] = getNodeSize(s);
    const [tw, th] = getNodeSize(t);
    let dx = t.x! - s.x!;
    let dy = t.y! - s.y!;

    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;

    const o1 = boxCollision(sw, sh, dx, dy);
    const o2 = boxCollision(tw, th, -dx, -dy);

    const tx = t.x! - dx * o2;
    const ty = t.y! - dy * o2;
    const arrowBack = 5;
    const arrowSide = 5;

    ctx.beginPath();
    ctx.moveTo(s.x! + dx * o1, s.y! + dy * o1);
    ctx.lineTo(tx, ty);
    ctx.lineTo(
        tx - dx * arrowBack + dy * arrowSide,
        ty - dy * arrowBack - dx * arrowSide
    );
    ctx.lineTo(tx, ty);
    ctx.lineTo(
        tx - dx * arrowBack - dy * arrowSide,
        ty - dy * arrowBack + dx * arrowSide
    );
    ctx.stroke();

    const origTransform = ctx.getTransform();
    const angle = Math.atan2(dy, dx);

    ctx.translate(s.x!, s.y!);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.translate(len * 0.5, 0);

    if (angle < -Math.PI * 0.5 || angle > Math.PI * 0.5) {
        ctx.rotate(Math.PI);
    }

    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(l.name, 0, 8);

    ctx.setTransform(origTransform);
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

            const linkName = stripPrefix(q.predicate.value, prefixes);

            links.push({
                source: subject.id,
                target: object.id,
                data: q,
                name: linkName
            });

            subject.longestLinkLength = Math.max(
                subject.longestLinkLength,
                linkName.length
            );

            object.longestLinkLength = Math.max(
                object.longestLinkLength,
                linkName.length
            );
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
                const linkSz = (n as Node).longestLinkLength * 6;

                return Math.max(w, h, linkSz) * 0.5 + 5;
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
                linkCanvasObject={renderLink}
                ref={graphRef as RefObject<GraphRef>}
                cooldownTime={Number.POSITIVE_INFINITY}
            />
        </div>
    );
});

export default GraphView;
