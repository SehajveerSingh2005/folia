import { useRef, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { forceCollide } from 'd3-force';

// Dynamic import for react-force-graph-2d because it requires window/canvas and doesn't support SSR out-of-the-box
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface ItemLink {
    id: string;
    source_item_id: string;
    source_item_type: string;
    target_item_id: string;
    target_item_type: string;
}

interface GraphNode {
    id: string;
    name: string;
    type: 'Garden' | 'Project';
    val: number; // Size weight
}

interface GraphLink {
    source: string;
    target: string;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

interface GraphLink {
    source: string;
    target: string;
}

interface GardenGraphProps {
    onNodeClick: (nodeId: string, type: 'Garden' | 'Project') => void;
}

const fetchGraphData = async (): Promise<GraphData> => {
    // 1. Fetch Garden Notes
    const { data: gardenData, error: gardenError } = await supabase
        .from('garden_items')
        .select('id, title');
    if (gardenError) throw new Error(gardenError.message);

    // 2. Fetch Flow Projects (loom_items)
    const { data: projectData, error: projectError } = await supabase
        .from('loom_items')
        .select('id, name, status');
    if (projectError) throw new Error(projectError.message);

    const activeProjects = projectData.filter(p => p.status !== 'Completed');

    // 3. Fetch Links
    const { data: linkData, error: linkError } = await supabase
        .from('item_links')
        .select('*');
    if (linkError) throw new Error(linkError.message);

    const nodes: GraphNode[] = [
        ...(gardenData || []).map(item => ({
            id: item.id,
            name: item.title || 'Untitled Note',
            type: 'Garden' as const,
            val: 1.5,
        })),
        ...(activeProjects || []).map(item => ({
            id: item.id,
            name: item.name || 'Untitled Project',
            type: 'Project' as const,
            val: 2.5,
        }))
    ];

    const links: GraphLink[] = (linkData || []).map(link => ({
        source: link.source_item_id,
        target: link.target_item_id,
    }));

    // Filter links where both source and target still exist in our nodes array
    const validLinks = links.filter(link =>
        nodes.some(n => n.id === link.source) && nodes.some(n => n.id === link.target)
    );

    return { nodes, links: validLinks };
};

const GardenGraph = ({ onNodeClick }: GardenGraphProps) => {
    const { theme } = useTheme();
    const fgRef = useRef<any>();
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: graphData, isLoading, error } = useQuery<GraphData>({
        queryKey: ['constellation_data'],
        queryFn: fetchGraphData,
    });

    // Handle Resize
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                // Ignore zero-dimension resizes as they happen initially momentarily
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    setDimensions({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height,
                    });
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Set an initial dimension manually if it's struggling to read from parent immediately
    useEffect(() => {
        if (containerRef.current && dimensions.width === 0) {
            const rect = containerRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setDimensions({ width: rect.width, height: rect.height });
            }
        }
    }, []);

    // Physics Tuning: Apply custom D3 forces for Obsidian feel
    useEffect(() => {
        if (fgRef.current && graphData) {
            // 1. Charge (Repulsion): 
            // A balanced negative charge provides a natural, even spread between all nodes.
            fgRef.current.d3Force('charge').strength(-150).distanceMax(250);

            // 2. Link (Springs):
            // Pull connected nodes together smoothly.
            fgRef.current.d3Force('link').distance(60);

            // 3. Collision:
            // Ensure bubbles don't literally overlap their text boundaries.
            fgRef.current.d3Force('collide', forceCollide().radius((node: any) => (node.val * 3) + 20).iterations(2));

            // 4. Center Gravity:
            // Gently pull the entire graph towards the center of the canvas so it doesn't drift away.
            fgRef.current.d3Force('center').strength(0.02);

            // Give it a tiny kick to apply the new forces without exploding
            fgRef.current.d3ReheatSimulation();
        }
    }, [graphData]);

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const textColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
    const textOutlineColor = isDark ? '#000000' : '#ffffff';
    const linkColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const gardenNodeColor = isDark ? '#bbf7d0' : '#166534'; // Green hue
    const projectNodeColor = isDark ? '#bfdbfe' : '#1e3a8a'; // Blue hue

    return (
        <div ref={containerRef} className="w-full h-full bg-background rounded-l-2xl shadow-inner border-l overflow-hidden relative">
            <div className="absolute top-6 left-8 z-10 pointer-events-none">
                <h2 className="text-3xl font-serif">Constellation</h2>
                <p className="text-muted-foreground text-sm flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: gardenNodeColor }}></span> Notes</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: projectNodeColor }}></span> Projects</span>
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-full w-full absolute inset-0 z-0">
                    <Loader2 className="animate-spin text-muted-foreground w-8 h-8" />
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-destructive p-8 text-center bg-destructive/5 rounded-xl border border-destructive/20 m-6 absolute inset-0 z-0">
                    <h3 className="text-xl font-medium mb-2">Constellation Error</h3>
                    <p>Ensure the `item_links` database table exists.</p>
                </div>
            ) : dimensions.width > 0 && dimensions.height > 0 && graphData ? (
                <ForceGraph2D
                    ref={fgRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeLabel="name"
                    nodeColor={(node: any) => node.type === 'Garden' ? gardenNodeColor : projectNodeColor}
                    linkColor={() => linkColor}
                    nodeRelSize={6}
                    minZoom={0.5}
                    maxZoom={3}
                    onNodeClick={(node: any) => {
                        onNodeClick(node.id, node.type);
                    }}
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const label = node.name;
                        const fontSize = 12 / globalScale;
                        ctx.font = `${fontSize}px Inter, sans-serif`;
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

                        ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
                        ctx.fillRect(
                            node.x - bckgDimensions[0] / 2,
                            node.y - bckgDimensions[1] / 2 + 10,
                            bckgDimensions[0],
                            bckgDimensions[1]
                        );

                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = textColor;
                        ctx.fillText(label, node.x, node.y + 10);

                        // Draw circle
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, node.val * 3, 0, 2 * Math.PI, false);
                        ctx.fillStyle = node.type === 'Garden' ? gardenNodeColor : projectNodeColor;
                        ctx.fill();

                        node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
                    }}
                    nodePointerAreaPaint={(node: any, color, ctx) => {
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, node.val * 3, 0, 2 * Math.PI, false);
                        ctx.fill();
                        const bckgDimensions = node.__bckgDimensions;
                        bckgDimensions && ctx.fillRect(
                            node.x - bckgDimensions[0] / 2,
                            node.y - bckgDimensions[1] / 2 + 10,
                            bckgDimensions[0],
                            bckgDimensions[1]
                        );
                    }}
                />
            ) : null}
        </div>
    );
};

export default GardenGraph;
