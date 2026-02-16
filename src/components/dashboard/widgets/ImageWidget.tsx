import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, Link as LinkIcon, Check, Move, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface ImageWidgetProps {
    data: { url?: string; title?: string; position?: { x: number; y: number }; scale?: number };
    onUpdate: (data: { url?: string; title?: string; position?: { x: number; y: number }; scale?: number }) => void;
    isEditable: boolean;
}

const ImageWidget = ({ data, onUpdate, isEditable }: ImageWidgetProps) => {
    const [isEditing, setIsEditing] = useState(!data.url);
    const [isRepositioning, setIsRepositioning] = useState(false);
    const [urlInput, setUrlInput] = useState(data.url || '');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'ai' | 'web'>('ai');
    const [error, setError] = useState<string | null>(null);

    // Repositioning & Zoom state
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [currentPos, setCurrentPos] = useState(data.position || { x: 50, y: 50 });
    const [currentScale, setCurrentScale] = useState(data.scale || 1);

    useEffect(() => {
        if (data.position) setCurrentPos(data.position);
        if (data.scale) setCurrentScale(data.scale);
    }, [data.position, data.scale]);

    const handleSave = () => {
        setError(null);
        let finalUrl = urlInput.trim();

        // Basic fix for Unsplash photo page URLs (naive attempt to get an image source)
        if (finalUrl.includes('unsplash.com/photos/')) {
            setError("That looks like a page link. Please right-click the image and chose 'Copy Image Address'.");
            return;
        }

        const img = new Image();
        img.onload = () => {
            onUpdate({ ...data, url: finalUrl });
            setIsEditing(false);
        };
        img.onerror = () => {
            setError("Could not load image. Check the link or try another.");
        };
        img.src = finalUrl;
    };

    const handleAiSearch = (term: string) => {
        if (!term) return;
        setIsLoading(true);
        // Generate 4 variations
        const newResults = Array.from({ length: 4 }).map(() => {
            const seed = Math.floor(Math.random() * 1000000);
            return `https://image.pollinations.ai/prompt/${encodeURIComponent(term)}?seed=${seed}&nologo=true`;
        });

// Simulate loading time 
setTimeout(() => {
    setSearchResults(newResults);
    setIsLoading(false);
}, 800);
    };

const selectImage = (url: string, title?: string) => {
    onUpdate({ ...data, url, title: title || data.title });
    setIsEditing(false);
};

// Reposition Logic
const handlePointerDown = (e: React.PointerEvent) => {
    if (!isRepositioning) return;
    e.stopPropagation(); // Stop grid drag
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragStart({ x: e.clientX, y: e.clientY });
};

const handlePointerMove = (e: React.PointerEvent) => {
    if (!isRepositioning || !dragStart) return;
    e.stopPropagation();
    e.preventDefault();

    // Adjust sensitivity based on zoom level (zoomed in = finer control needed usually, but dragging standard distance should move image same amount visually)
    // With scale, the image is larger. 
    const sensitivity = 0.5 / currentScale;
    const deltaX = (dragStart.x - e.clientX) * sensitivity;
    const deltaY = (dragStart.y - e.clientY) * sensitivity;

    // Update position (clamped 0-100)
    const newX = Math.min(100, Math.max(0, currentPos.x + deltaX));
    const newY = Math.min(100, Math.max(0, currentPos.y + deltaY));

    setCurrentPos({ x: newX, y: newY });
    setDragStart({ x: e.clientX, y: e.clientY });
};

const handlePointerUp = (e: React.PointerEvent) => {
    if (!isRepositioning) return;
    e.stopPropagation();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragStart(null);
    // Save final position
    onUpdate({ ...data, position: currentPos, scale: currentScale });
};

const handleZoomChange = (value: number[]) => {
    const newScale = value[0];
    setCurrentScale(newScale);
};

// Save on finish
const handleFinishReposition = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ ...data, position: currentPos, scale: currentScale });
    setIsRepositioning(false);
};

if (isEditing) {
    return (
        <div className="h-full w-full flex flex-col items-center p-4 bg-muted/20 rounded-lg overflow-y-auto">
            <div className="w-full space-y-4">
                <div className="flex w-full border-b sticky top-0 bg-transparent z-10">
                    <button onClick={() => setActiveTab('ai')} className={`flex-1 pb-2 text-xs font-medium ${activeTab === 'ai' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}>AI Gen</button>
                    <button onClick={() => setActiveTab('web')} className={`flex-1 pb-2 text-xs font-medium ${activeTab === 'web' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}>Web / URL</button>
                </div>

                {activeTab === 'web' && (
                    <div className="space-y-3 pt-2">
                        <div className="flex gap-2 justify-center mb-2">
                            <Button variant="outline" size="sm" className="h-6 text-[10px]" asChild>
                                <a href="https://unsplash.com/s/photos/" target="_blank" rel="noreferrer">Unsplash ↗</a>
                            </Button>
                            <Button variant="outline" size="sm" className="h-6 text-[10px]" asChild>
                                <a href="https://www.pexels.com/search/" target="_blank" rel="noreferrer">Pexels ↗</a>
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Input
                                    key="url-input"
                                    value={urlInput}
                                    onChange={(e) => {
                                        setUrlInput(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="Paste image address..."
                                    className="h-8 text-xs"
                                />
                                <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0">
                                    <Check className="h-4 w-4" />
                                </Button>
                            </div>
                            {error && <p className="text-[10px] text-destructive leading-tight">{error}</p>}
                            <p className="text-[10px] text-muted-foreground">
                                Tip: Right-click an image on the web and select <b>"Copy Image Address"</b>.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="space-y-3 pt-2">
                        <div className="flex gap-2 items-center">
                            <Input
                                key="ai-input"
                                placeholder="zen garden, neon city..."
                                className="h-8 text-xs bg-background/50"
                                disabled={isLoading}
                                defaultValue={data.title || ''}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAiSearch((e.currentTarget as HTMLInputElement).value);
                                    }
                                }}
                            />
                            {isLoading && <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />}
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                {searchResults.map((url, i) => (
                                    <div key={i} className="group/item relative aspect-square bg-black/5 rounded-md overflow-hidden cursor-pointer border hover:border-primary transition-all" onClick={() => selectImage(url)}>
                                        <img src={url} alt="Result" className="w-full h-full object-cover" loading="lazy" />
                                        <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] text-muted-foreground text-center py-4">Press Enter to generate variations.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

return (
    <div
        className={cn(
            "group relative h-full w-full overflow-hidden bg-black/5",
            isRepositioning ? "cursor-move ring-2 ring-primary ring-inset" : ""
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
    >
        {data.url ? (
            <img
                src={data.url}
                alt={data.title || 'Dashboard Image'}
                className="h-full w-full object-cover transition-transform duration-150 ease-out will-change-transform" // Faster transition for zoom
                style={{
                    objectPosition: `${currentPos.x}% ${currentPos.y}%`,
                    transform: `scale(${currentScale})`
                }}
            />
        ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 opacity-20" />
            </div>
        )}

        {/* Edit Overlay */}
        {!isRepositioning ? (
            <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 ${isEditable ? 'opacity-100' : ''}`}>
                {data.url && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setIsRepositioning(true); }}
                        className="h-7 w-7 p-0 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:scale-105 transition-transform"
                        title="Reposition"
                    >
                        <Move className="h-3 w-3" />
                    </Button>
                )}

                {data.url && data.url.includes('pollinations.ai') && data.title && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAiSearch(data.title!)}
                        className="h-7 px-2 text-xs bg-background/80 backdrop-blur-sm shadow-sm"
                        disabled={isLoading}
                    >
                        {isLoading ? '...' : 'Regenerate'}
                    </Button>
                )}
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-7 px-2 text-xs bg-background/80 backdrop-blur-sm shadow-sm"
                >
                    Change
                </Button>
            </div>
        ) : (
            <div className="absolute top-2 inset-x-2 flex justify-between items-start z-20 pointer-events-none">
                {/* Zoom Controls */}
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-1.5 flex flex-col gap-2 pointer-events-auto min-w-[32px] items-center animate-in fade-in slide-in-from-top-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                        onClick={(e) => { e.stopPropagation(); setCurrentScale(s => Math.min(3, s + 0.1)); }}
                    >
                        <ZoomIn className="h-3 w-3" />
                    </Button>
                    <div className="h-20 flex items-center">
                        <Slider
                            orientation="vertical"
                            value={[currentScale]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={handleZoomChange}
                            className="h-full"
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                        onClick={(e) => { e.stopPropagation(); setCurrentScale(s => Math.max(1, s - 0.1)); }}
                    >
                        <ZoomOut className="h-3 w-3" />
                    </Button>
                </div>

                {/* Done Button */}
                <div className="flex gap-2 pointer-events-auto">
                    <Button
                        size="sm"
                        onClick={handleFinishReposition}
                        className="h-7 px-3 text-xs shadow-lg animate-in fade-in"
                    >
                        Done
                    </Button>
                </div>
            </div>
        )}
    </div>
);
};

export default ImageWidget;
