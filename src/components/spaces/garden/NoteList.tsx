import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export type GardenItem = {
    id: string;
    title: string | null;
    content: string;
    category: string | null;
    created_at: string;
    updated_at?: string; // Assuming we might have this, or use created_at
};

interface NoteListProps {
    items: GardenItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: () => void;
    isPinned: boolean;
    onTogglePin: () => void;
}

const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

const NoteList = ({ items, selectedId, onSelect, onAdd, isPinned, onTogglePin }: NoteListProps) => {
    const [search, setSearch] = useState('');

    const filteredItems = items.filter(item => {
        const term = search.toLowerCase();
        const titleMatch = (item.title || 'Untitled').toLowerCase().includes(term);
        const plainContent = stripHtml(item.content || '');
        const contentMatch = plainContent.toLowerCase().includes(term);
        return titleMatch || contentMatch;
    });

    return (
        <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-background/50 backdrop-blur-xl">
            <div className="p-4 border-b space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Notes</h3>
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
                        placeholder="Search garden..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>
            <ScrollArea className="flex-grow w-full">
                <div className="p-3 space-y-2 w-full">
                    {filteredItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className={cn(
                                "flex flex-col gap-1 py-2 px-3 rounded-md cursor-pointer transition-colors hover:bg-accent/50 w-full overflow-hidden",
                                selectedId === item.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <div className="flex items-center justify-between min-w-0">
                                <span className={cn("font-medium truncate", !item.title && "italic opacity-70")}>
                                    {item.title || 'Untitled'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs opacity-70 mt-1 w-full min-w-0">
                                <span className="truncate flex-1 w-0 mr-2 min-w-0">
                                    {stripHtml(item.content || '').slice(0, 50).replace(/\n/g, ' ') || 'No content'}
                                </span>
                                <span className="whitespace-nowrap flex-shrink-0">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                            </div>
                        </div>
                    ))}
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
