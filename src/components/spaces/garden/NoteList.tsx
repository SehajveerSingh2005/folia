import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Pin, PinOff, LayoutGrid, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const ENTRY_TYPES = ['Idea', 'Quote', 'Reference', 'Clipping', 'Observation'] as const;
type EntryType = typeof ENTRY_TYPES[number];

const typeColors: Record<EntryType, string> = {
  Idea:        'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20',
  Quote:       'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
  Reference:   'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20',
  Clipping:    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  Observation: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20',
};

export type GardenItem = {
    id: string;
    title: string | null;
    content: string;
    category: string | null;      // repurposed as entry_type
    tags: string[] | null;        // free-form tags
    source: string | null;        // for quotes/clippings
    created_at: string;
    updated_at?: string;
};

interface NoteListProps {
    items: GardenItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: () => void;
    isPinned: boolean;
    onTogglePin: () => void;
    viewMode: 'editor' | 'graph';
    onChangeViewMode: (mode: 'editor' | 'graph') => void;
}

const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

const NoteList = ({ items, selectedId, onSelect, onAdd, isPinned, onTogglePin, viewMode, onChangeViewMode }: NoteListProps) => {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    const filteredItems = items.filter(item => {
        const term = search.toLowerCase();
        const titleMatch = (item.title || 'Untitled').toLowerCase().includes(term);
        const plainContent = stripHtml(item.content || '');
        const contentMatch = plainContent.toLowerCase().includes(term);
        const tagMatch = item.tags?.some(t => t.toLowerCase().includes(term));
        const typeMatch = !typeFilter || item.category === typeFilter;
        return (titleMatch || contentMatch || tagMatch) && typeMatch;
    });

    return (
        <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-background/50 backdrop-blur-xl">
            <div className="p-4 border-b space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex bg-muted/50 p-1 rounded-md">
                        <div
                            onClick={() => onChangeViewMode('editor')}
                            className={cn(
                                "cursor-pointer p-1.5 rounded-sm transition-colors",
                                viewMode === 'editor' ? "bg-background shadow-sm text-foreground" : "hover:bg-muted/80 text-muted-foreground"
                            )}
                            title="Editor View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </div>
                        <div
                            onClick={() => onChangeViewMode('graph')}
                            className={cn(
                                "cursor-pointer p-1.5 rounded-sm transition-colors",
                                viewMode === 'graph' ? "bg-background shadow-sm text-foreground" : "hover:bg-muted/80 text-muted-foreground"
                            )}
                            title="Constellation View"
                        >
                            <Network className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={onTogglePin} title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}>
                            {isPinned ? <Pin className="h-4 w-4 rotate-45" /> : <PinOff className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={onAdd} title="New Note">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notes…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                {/* Type filter chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                    <button
                        onClick={() => setTypeFilter(null)}
                        className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full border transition-all',
                            !typeFilter ? 'bg-foreground text-background border-foreground' : 'border-border/50 text-muted-foreground hover:border-border'
                        )}
                    >
                        All
                    </button>
                    {ENTRY_TYPES.map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                            className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full border transition-all',
                                typeFilter === t ? typeColors[t] : 'border-border/50 text-muted-foreground hover:border-border'
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>
            <ScrollArea className="flex-grow w-full">
                <div className="p-3 space-y-2 w-full">
                    {filteredItems.map(item => {
                        const entryType = item.category as EntryType | null;
                        return (
                            <div
                                key={item.id}
                                onClick={() => onSelect(item.id)}
                                className={cn(
                                    "flex flex-col gap-1 py-2 px-3 rounded-md cursor-pointer transition-colors hover:bg-accent/50 w-full overflow-hidden",
                                    selectedId === item.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )}
                            >
                                <div className="flex items-center justify-between min-w-0 gap-2">
                                    <span className={cn("font-medium truncate text-sm", !item.title && "italic opacity-70")}>
                                        {item.title || 'Untitled'}
                                    </span>
                                    {entryType && ENTRY_TYPES.includes(entryType) && (
                                        <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 font-medium', typeColors[entryType])}>
                                            {entryType}
                                        </span>
                                    )}
                                </div>
                                {/* Tags */}
                                {item.tags && item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {item.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[9px] text-muted-foreground bg-muted/60 px-1.5 rounded">{tag}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-xs opacity-70 mt-0.5 w-full min-w-0">
                                    <span className="truncate flex-1 w-0 mr-2 min-w-0">
                                        {stripHtml(item.content || '').slice(0, 45).replace(/\n/g, ' ') || 'No content'}
                                    </span>
                                    <span className="whitespace-nowrap flex-shrink-0">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                                </div>
                            </div>
                        );
                    })}
                    {filteredItems.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {search ? 'No matches found.' : 'No notes yet.'}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default NoteList;
