import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Pencil, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface NoteWidgetProps {
    data: { content?: string; color?: string; font?: string; fontSize?: number; textAlign?: 'left' | 'center' | 'right' };
    onUpdate: (data: { content?: string; color?: string; font?: string; fontSize?: number; textAlign?: 'left' | 'center' | 'right' }) => void;
    isEditableLayout: boolean; // Renamed to distinguish from content editing
}

const NoteWidget = ({ data, onUpdate, isEditableLayout }: NoteWidgetProps) => {
    const [content, setContent] = useState(data.content || '');
    const [isFocused, setIsFocused] = useState(false);
    const [isToolbarOpen, setIsToolbarOpen] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setContent(data.content || '');
    }, [data.content]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setContent(newVal);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            onUpdate({ ...data, content: newVal });
        }, 1000);
    };

    const handleFontSizeChange = (delta: number) => {
        const currentSize = data.fontSize || 16;
        const newSize = Math.max(12, Math.min(64, currentSize + delta));
        onUpdate({ ...data, fontSize: newSize });
    };

    const colors = [
        { name: 'yellow', class: 'bg-[#fcf085] dark:bg-yellow-500/20' }, // More saturated yellow
        { name: 'blue', class: 'bg-blue-100 dark:bg-blue-900/20' },
        { name: 'green', class: 'bg-green-100 dark:bg-green-900/20' },
        { name: 'pink', class: 'bg-pink-100 dark:bg-pink-900/20' },
        { name: 'purple', class: 'bg-purple-100 dark:bg-purple-900/20' },
        { name: 'gray', class: 'bg-muted/50' },
        { name: 'transparent', class: 'bg-background border-2 border-dashed border-muted' },
    ];

    const fonts = [
        { name: 'sans', class: 'font-sans', label: 'Sans' },
        { name: 'serif', class: 'font-serif', label: 'Serif' },
        { name: 'mono', class: 'font-mono', label: 'Mono' },
    ];

    const alignments = [
        { name: 'left', icon: AlignLeft },
        { name: 'center', icon: AlignCenter },
        { name: 'right', icon: AlignRight },
    ];

    const currentColor = colors.find(c => c.name === data.color) || colors[0];

    return (
        <div className={cn(
            "group/note h-full w-full flex flex-col transition-colors relative",
            data.color === 'transparent' ? "bg-background" :
                data.color === 'blue' ? "bg-blue-100 dark:bg-blue-900/20" :
                    data.color === 'green' ? "bg-green-100 dark:bg-green-900/20" :
                        data.color === 'pink' ? "bg-pink-100 dark:bg-pink-900/20" :
                            data.color === 'purple' ? "bg-purple-100 dark:bg-purple-900/20" :
                                data.color === 'gray' ? "bg-muted/50" :
                                    "bg-[#fcf085] dark:bg-yellow-500/20" // default
        )}>
            {/* Edit Toggle Button */}
            <div className={`absolute top-2 right-2 transition-opacity z-20 ${isEditableLayout ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover/note:opacity-100'}`}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsToolbarOpen(!isToolbarOpen)}
                    className={cn(
                        "h-8 w-8 p-0 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm",
                        isToolbarOpen && "bg-black/10 dark:bg-white/10 text-primary"
                    )}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </div>

            {/* Controls Overlay */}
            {isToolbarOpen && (
                <div className="absolute top-12 right-2 z-30 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="bg-background/95 backdrop-blur-md shadow-xl border rounded-xl p-3 flex flex-col gap-3 w-52">

                        {/* Typography & Alignment Row */}
                        <div className="flex flex-col gap-2">
                            <div className="flex bg-muted/50 rounded-lg p-0.5 w-full">
                                {fonts.map(f => (
                                    <button
                                        key={f.name}
                                        onClick={() => onUpdate({ ...data, font: f.name })}
                                        className={cn(
                                            "flex-1 py-1 text-[10px] uppercase font-bold rounded-md transition-all",
                                            data.font === f.name ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                        )}
                                        title={f.label}
                                    >
                                        {f.name === 'sans' ? 'Ag' : f.name === 'serif' ? 'Ag' : 'Ag'}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center justify-between">
                                {/* Alignment */}
                                <div className="flex bg-muted/50 rounded-lg p-0.5">
                                    {alignments.map(a => (
                                        <button
                                            key={a.name}
                                            onClick={() => onUpdate({ ...data, textAlign: a.name as any })}
                                            className={cn(
                                                "p-1 rounded-md transition-all",
                                                (data.textAlign || 'left') === a.name ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <a.icon className="h-3 w-3" />
                                        </button>
                                    ))}
                                </div>

                                {/* Font Size */}
                                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                                    <button
                                        onClick={() => handleFontSizeChange(-2)}
                                        className="h-5 w-5 flex items-center justify-center text-xs font-bold rounded hover:bg-background transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className="text-[10px] font-mono text-muted-foreground min-w-[20px] text-center leading-none">{data.fontSize || 16}</span>
                                    <button
                                        onClick={() => handleFontSizeChange(2)}
                                        className="h-5 w-5 flex items-center justify-center text-xs font-bold rounded hover:bg-background transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Colors Row */}
                        <div className="flex gap-1.5 justify-center pt-2 border-t border-border/50">
                            {colors.map(c => (
                                <button
                                    key={c.name}
                                    className={cn(
                                        "w-5 h-5 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/20",
                                        c.class,
                                        "border border-black/10 dark:border-white/10",
                                        data.color === c.name && "ring-2 ring-primary ring-offset-1"
                                    )}
                                    onClick={() => onUpdate({ ...data, color: c.name })}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Note Content */}
            <Textarea
                value={content}
                onChange={handleChange}
                placeholder="Write a note..."
                spellCheck={isFocused}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    fontSize: `${data.fontSize || 16}px`
                }}
                className={cn(
                    "flex-1 w-full h-full resize-none border-none bg-transparent p-4 focus-visible:ring-0 leading-relaxed nodrag cursor-text placeholder:text-black/20 dark:placeholder:text-white/20",
                    isEditableLayout && "cursor-move",
                    data.font === 'serif' ? 'font-serif' : data.font === 'mono' ? 'font-mono' : 'font-sans',
                    data.textAlign === 'center' ? 'text-center' : data.textAlign === 'right' ? 'text-right' : 'text-left'
                )}
            />
        </div>
    );
};

export default NoteWidget;
