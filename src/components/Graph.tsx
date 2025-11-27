import { useEffect, useRef, useState } from "react";
import type { Link, Node } from "../constants";
import { sleep, isWinner, currentNodeHasWinningPath } from "../utils";

const ForceGraphWrapper = ({
  data,
  onNodeClick,
  currentNode,
  simulationSpeed,
  findFastestWinFromCurrent
}: {
  data: { nodes: Node[]; links: Link[] };
  onNodeClick?: (node: Node) => void;
  currentNode: Node;
  simulationSpeed: number;
  findFastestWinFromCurrent: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // @ts-ignore
  const graphRef = useRef<ReturnType<typeof ForceGraph3D> | null>(null);
  const [isSimulatingWin, setIsSimulatingWin] = useState(false);
  const isSimulatingRef = useRef(false);
  const simulationSpeedRef = useRef(simulationSpeed);

  useEffect(() => {
    // @ts-ignore
    if (!containerRef.current || !window.ForceGraph3D) return;
    // @ts-ignore
    const Graph = window.ForceGraph3D()(containerRef.current)
      .graphData(data)
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight)
      .backgroundColor("#0f172a") // Slate-900
      .nodeLabel("id")
      .nodeColor((node: Node) =>
        node.group === 1 ? "#fbbf24" : node.group === 3 ? "#0f0" : "#60a5fa"
      )
      .nodeVal("val")
      .linkColor((link: Link) => (link.isWinningPath ? "#4ade80" : "#ffffff30"))
      .linkOpacity((link: Link) => (link.isWinningPath ? 1 : 0.3))
      .linkWidth((link: Link) => (link.isWinningPath ? 1.5 : 0.5))
      .onNodeClick((node: Node) => {
        setIsSimulatingWin(false);
        isSimulatingRef.current = false;
        _onNodeClick(node);
      });
    Graph.d3Force("charge").strength(-120);
    graphRef.current = Graph;

    const handleResize = () => {
      if (containerRef.current) {
        Graph.width(containerRef.current.clientWidth);
        Graph.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      Graph._destructor();
    };
  }, [data]);

  useEffect(() => {
    simulationSpeedRef.current = simulationSpeed;
  }, [simulationSpeed]);

  const _onNodeClick = (node: Node) => {
    const distance = 600;
    const distRatio = 1 + distance / Math.hypot(node.x!, node.y!, node.z!);
    graphRef.current.cameraPosition(
      {
        x: node.x! * distRatio,
        y: node.y! * distRatio,
        z: node.z! * distRatio,
      },
      node,
      simulationSpeedRef.current
    );
    if (onNodeClick) onNodeClick(node);
    graphRef.current.nodeColor(graphRef.current.nodeColor());
  };

  const simulateWin = async () => {
    if (!graphRef.current) return;
    if (!currentNodeHasWinningPath(data, currentNode)) {
      findFastestWinFromCurrent();
      return;
    }
    let previousNode = currentNode;
    let previousLink: Link;
    for (let link of data.links) {
        // @ts-ignore
        if (link.source.id == currentNode.id) {
          // @ts-ignore
          if (link.isWinningPath) {
            previousLink = link;
            previousNode = currentNode;
            break;
          }
        }
    }
    setIsSimulatingWin(true);
    isSimulatingRef.current = true;

    // @ts-ignore
    if (previousLink) _onNodeClick(previousLink!.target);
    // @ts-ignore
    while (previousLink?.isWinningPath && !isWinner(previousLink.target.blocks)) {
      if (!isSimulatingRef.current) break;
      await sleep(simulationSpeedRef.current);
      // @ts-ignore
      for (let link of data.links) {
        // @ts-ignore
        if (link.source.id == previousLink.target.id && previousNode.id != link.target.id) {
          // @ts-ignore
          if (link.isWinningPath) {
            previousLink = link;
            previousNode = previousLink.source as Node;
            break;
          }
        }
      }
      // @ts-ignore
      if (previousLink) _onNodeClick(previousLink.target);
    }
    isSimulatingRef.current = false;
    setIsSimulatingWin(false);
  };

  if (!data || data.nodes.length == 0)
    return (
      <div className="w-full h-full flex items-center justify-center">
        No nodes found. Try increasing the search space
      </div>
    );

  return (
    <>
      <div
        style={{ position: "absolute", top: "10px", right: "50px", zIndex: 1 }}
      >
        <button
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors cursor-pointer"
          onClick={() => {
            setIsSimulatingWin(false);
            isSimulatingRef.current = false;
            if (graphRef.current) {
              graphRef.current.zoomToFit();
            }
          }}
        >
          Reset View
        </button>
        <button
          className={`bg-blue-500 text-white px-4 py-2 rounded cursor-pointer ${isWinner(currentNode.blocks) ? 'opacity-50 cursor-default' : ''}`}
          style={{ marginLeft: "10px" }}
          disabled={isWinner(currentNode.blocks)}
          onClick={
            !isSimulatingWin ? simulateWin : 
            () => {
              setIsSimulatingWin(false);
              isSimulatingRef.current = false;
            }
          }
        >
          {isWinner(currentNode.blocks) ? 'You win!' : !currentNodeHasWinningPath(data, currentNode) ? "Find/Simulate Win" : isSimulatingWin ? "Stop Simulation" : "Simulate Win"}
        </button>
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
};

export default ForceGraphWrapper;
