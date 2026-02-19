import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Settings2, AlignLeft, AlignCenter, AlignRight, Italic, AlignVerticalJustifyCenter, Type } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Toggle } from '@/components/ui/toggle';
import { Slider } from '@/components/ui/slider';

interface NoteWidgetProps {
    data: {
        content?: string;
        color?: string;
        font?: string;
        fontSize?: number;
        textAlign?: 'left' | 'center' | 'right' | 'justify';
        isItalic?: boolean;
        isVerticalCenter?: boolean;
    };
    onUpdate: (data: any) => void;
    isEditableLayout: boolean;
}

const NoteWidget = ({ data, onUpdate, isEditableLayout }: NoteWidgetProps) => {
    const [content, setContent] = useState(data.content || '');
    const [isFocused, setIsFocused] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Defaults
    const fontSize = data.fontSize || 16;
    const textAlign = data.textAlign || 'left';
    const font = data.font || 'sans';
    const color = data.color || 'yellow';
    const isItalic = data.isItalic || false;
    const isVerticalCenter = data.isVerticalCenter || false;

    useEffect(() => {
        if (contentRef.current && contentRef.current.innerText !== data.content) {
            // Only update if content is different to avoid cursor jumps on external updates (rare here)
            // But for initial load:
            if (data.content !== undefined) {
                contentRef.current.innerText = data.content;
                setContent(data.content);
            }
        }
    }, [data.content]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const newVal = e.currentTarget.innerText;
        setContent(newVal);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            onUpdate({ ...data, content: newVal });
        }, 1000);
    };

    const updateSettings = (updates: any) => {
        onUpdate({ ...data, ...updates });
    };

    const colors = [
        { name: 'yellow', class: 'bg-[#fcf085] dark:bg-yellow-500/20' },
        { name: 'blue', class: 'bg-blue-100 dark:bg-blue-900/20' },
        { name: 'green', class: 'bg-green-100 dark:bg-green-900/20' },
        { name: 'pink', class: 'bg-pink-100 dark:bg-pink-900/20' },
        { name: 'purple', class: 'bg-purple-100 dark:bg-purple-900/20' },
        { name: 'gray', class: 'bg-muted/50' },
        { name: 'transparent', class: 'bg-background border-2 border-dashed border-muted' },
    ];

    const currentColorObj = colors.find(c => c.name === color) || colors[0];

    return (
        <div className={cn(
            "group/note h-full w-full flex flex-col relative transition-colors overflow-hidden",
            currentColorObj.class
        )}>
            {/* Settings Trigger */}
            <div className={cn(
                "absolute top-2 left-2 transition-opacity z-20",
                isEditableLayout ? "opacity-0 pointer-events-none" : "opacity-0 group-hover/note:opacity-100"
            )}>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm">
                            <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3" align="start">
                        <div className="flex flex-col gap-4">
                            {/* Font Family */}
                            <ToggleGroup type="single" value={font} onValueChange={(v) => v && updateSettings({ font: v })}>
                                <ToggleGroupItem value="sans" aria-label="Sans" className="flex-1 h-7 text-xs"><span className="font-sans">Sans</span></ToggleGroupItem>
                                <ToggleGroupItem value="serif" aria-label="Serif" className="flex-1 h-7 text-xs"><span className="font-serif">Serif</span></ToggleGroupItem>
                                <ToggleGroupItem value="mono" aria-label="Mono" className="flex-1 h-7 text-xs"><span className="font-mono">Mono</span></ToggleGroupItem>
                            </ToggleGroup>

                            {/* Font Size */}
                            <div className="flex items-center gap-3">
                                <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <Slider
                                    defaultValue={[fontSize]}
                                    max={64}
                                    min={12}
                                    step={1}
                                    onValueChange={(vals) => updateSettings({ fontSize: vals[0] })}
                                    className="flex-1"
                                />
                                <span className="text-[10px] w-4 text-right">{fontSize}</span>
                            </div>

                            {/* Formatting & Alignment */}
                            <div className="flex justify-between items-center gap-1">
                                <ToggleGroup type="single" value={textAlign} onValueChange={(v) => v && updateSettings({ textAlign: v })} className="gap-0.5">
                                    <ToggleGroupItem value="left" size="sm" className="h-7 w-7 p-0"><AlignLeft className="h-3.5 w-3.5" /></ToggleGroupItem>
                                    <ToggleGroupItem value="center" size="sm" className="h-7 w-7 p-0"><AlignCenter className="h-3.5 w-3.5" /></ToggleGroupItem>
                                    <ToggleGroupItem value="right" size="sm" className="h-7 w-7 p-0"><AlignRight className="h-3.5 w-3.5" /></ToggleGroupItem>
                                </ToggleGroup>
                                <div className="w-px h-4 bg-border mx-0.5" />
                                <Toggle size="sm" pressed={isItalic} onPressedChange={(v) => updateSettings({ isItalic: v })} className="h-7 w-7 p-0"><Italic className="h-3.5 w-3.5" /></Toggle>
                                <Toggle size="sm" pressed={isVerticalCenter} onPressedChange={(v) => updateSettings({ isVerticalCenter: v })} className="h-7 w-7 p-0"><AlignVerticalJustifyCenter className="h-3.5 w-3.5" /></Toggle>
                            </div>

                            {/* Colors */}
                            <div className="flex gap-1.5 justify-between pt-2 border-t border-border/50">
                                {colors.map(c => (
                                    <button
                                        key={c.name}
                                        className={cn(
                                            "w-4 h-4 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/20",
                                            c.class,
                                            "border border-black/10 dark:border-white/10",
                                            color === c.name && "ring-1 ring-primary ring-offset-1"
                                        )}
                                        onClick={() => updateSettings({ color: c.name })}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Note Content */}
            <div
                className={cn(
                    "flex-1 w-full h-full p-4 overflow-hidden",
                    isVerticalCenter ? "flex flex-col justify-center" : ""
                )}
                onClick={() => {
                    if (!isEditableLayout && contentRef.current) {
                        contentRef.current.focus();
                    }
                }}
            >
                <div
                    ref={contentRef}
                    contentEditable={!isEditableLayout}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={{
                        fontSize: `${fontSize}px`,
                        outline: 'none',
                    }}
                    className={cn(
                        "w-full bg-transparent leading-relaxed cursor-text empty:before:content-['Write_a_note...'] empty:before:text-black/20 dark:empty:before:text-white/20",
                        isEditableLayout && "cursor-move pointer-events-none",
                        font === 'serif' ? 'font-serif' : font === 'mono' ? 'font-mono' : 'font-sans',
                        textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left',
                        isItalic && "italic",
                        // Ensure it doesn't overflow horizontally
                        "break-words whitespace-pre-wrap max-h-full overflow-y-auto scrollbar-none"
                    )}
                />
            </div>
        </div>
    );
};

export default NoteWidget;
