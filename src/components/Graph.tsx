import { useEffect, useRef, useState } from "react";
import type { Link, Node } from "../constants";
import { sleep } from "../utils";

const ForceGraphWrapper = ({ data, onNodeClick, currentNode, simulationSpeed }: { data: { nodes: Node[]; links: Link[] }; onNodeClick?: (node: Node) => void; currentNode: Node, simulationSpeed: number }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ReturnType<typeof ForceGraph3D> | null>(null);
  const [isSimulatingWin, setIsSimulatingWin] = useState(false);
  const isSimulatingRef = useRef(false);
  const simulationSpeedRef = useRef(simulationSpeed);

  useEffect(() => {
    if (!containerRef.current || !window.ForceGraph3D) return;
    const Graph = window.ForceGraph3D()(containerRef.current)
      .graphData(data)
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight)
      .backgroundColor('#0f172a') // Slate-900
      .nodeLabel('id')
      .nodeColor((node: Node) => node.group === 1 ? '#fbbf24' : node.group === 3 ? '#0f0' : '#60a5fa')
      .nodeVal('val')
      .linkColor((link: Link) => link.isWinningPath ? '#4ade80' : '#ffffff30')
      .linkOpacity((link: Link) => link.isWinningPath ? 1 : 0.3)
      .linkWidth((link: Link) => link.isWinningPath ? 1.5 : 0.5)
      .onNodeClick((node: Node) => {
        setIsSimulatingWin(false);
        isSimulatingRef.current = false;
        _onNodeClick(node)
      });
    Graph.d3Force('charge').strength(-120);
    graphRef.current = Graph;
    
    const handleResize = () => {
       if (containerRef.current) {
         Graph.width(containerRef.current.clientWidth);
         Graph.height(containerRef.current.clientHeight);
       }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      Graph._destructor();
    }
  }, [data]);

  useEffect(() => {
    simulationSpeedRef.current = simulationSpeed;
  }, [simulationSpeed]);

  const _onNodeClick = (node: Node) => {
    const distance = 600;
    const distRatio = 1 + distance/Math.hypot(node.x!, node.y!, node.z!);
    graphRef.current.cameraPosition(
      { x: node.x! * distRatio, y: node.y! * distRatio, z: node.z! * distRatio },
      node,
      simulationSpeedRef.current
    );
    if (onNodeClick) onNodeClick(node);
    graphRef.current.nodeColor(graphRef.current.nodeColor());
  }

  const simulateWin = async () => {
    if (!graphRef.current) return;
    setIsSimulatingWin(true);
    isSimulatingRef.current = true;
    let nextLink = data.links.find(l => l.source.id == currentNode.id);
    if (!nextLink!.target.isWinningPath) {
      alert("No winning path from current node.");
      setIsSimulatingWin(false);
      isSimulatingRef.current = false;
      return;
    }
    if (nextLink) _onNodeClick(nextLink!.target)
    while (nextLink && nextLink.target.isWinningPath) {
      if (!isSimulatingRef.current) break;
      await sleep(simulationSpeedRef.current);
      if (!isSimulatingRef.current) break;
      nextLink = data.links.find(l => l.source.id == nextLink.target.id);
      if (nextLink) _onNodeClick(nextLink.target);
    }
    isSimulatingRef.current = false;
    setIsSimulatingWin(false);
  }

  if (!data || data.nodes.length == 0) return <div className="w-full h-full flex items-center justify-center">No nodes found. Try increasing the search space</div>;
  return (
    <>
      <div style={{ position: "absolute", top: "10px", right: "50px", zIndex: 1 }}>
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
          className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
          style={{ marginLeft: "10px" }}
          onClick={!isSimulatingWin ? () => {setIsSimulatingWin(true); simulateWin()} : () => {setIsSimulatingWin(false); isSimulatingRef.current = false;}}
        >
          {isSimulatingWin ? "Stop Simulation" : "Simulate Win"}
        </button>
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
};

export default ForceGraphWrapper;
