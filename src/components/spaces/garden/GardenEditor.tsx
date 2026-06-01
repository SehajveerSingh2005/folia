import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextareaAutosize from 'react-textarea-autosize';
import { useState, useEffect, useRef } from 'react';
import { GardenItem } from './NoteList';
import { MoreHorizontal, Download, Trash2, Tag, FolderKanban, ExternalLink } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { SlashCommand } from './SlashCommand';
import { ItemLinker } from './ItemLinker';
import { cn } from '@/lib/utils';

const ENTRY_TYPES = ['Idea', 'Quote', 'Reference', 'Clipping', 'Observation'] as const;
type EntryType = typeof ENTRY_TYPES[number];

const typeColors: Record<EntryType, string> = {
  Idea:        'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20',
  Quote:       'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
  Reference:   'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20',
  Clipping:    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  Observation: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20',
};

interface GardenEditorProps {
    item: GardenItem;
    onUpdate: (id: string, data: Partial<GardenItem>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

const GardenEditor = ({ item, onUpdate, onDelete }: GardenEditorProps) => {
    const [title, setTitle] = useState(item.title || '');
    const [entryType, setEntryType] = useState<string>(item.category || '');
    const [tagsInput, setTagsInput] = useState(item.tags?.join(', ') || '');
    const [source, setSource] = useState(item.source || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handlePromoteToProject = async () => {
        setIsPromoting(true);
        try {
            const plainContent = editor?.getText() || '';
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: title || 'Untitled',
                    notes: plainContent.slice(0, 500) + (plainContent.length > 500 ? '…' : ''),
                    source_note_id: item.id,
                }),
            });
            if (!response.ok) throw new Error('Failed to promote note');
            // Show toast with link — using showSuccess from utils
            const { showSuccess } = await import('@/utils/toast');
            showSuccess(`"${title || 'Untitled'}" promoted to Projects!`);
        } catch (err) {
            const { showError } = await import('@/utils/toast');
            showError('Could not promote note to project.');
        } finally {
            setIsPromoting(false);
        }
    };

    // Initialize Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: "Write something... (Type '/' for commands, '#' for heading)",
            }),
            SlashCommand,
        ],
        content: item.content || '',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[500px]',
            },
        },
        onUpdate: ({ editor }) => {
            const newContent = editor.getHTML();
            debouncedSave(title, newContent);
        },
    });

    // Sync content when switching notes
    useEffect(() => {
        // Content sync logic (simplified for now to avoid loops)
        if (editor && editor.getHTML() !== item.content) {
            // We generally trust the editor state while active, but if we switch notes ID changes.
        }
    }, [item.id]);

    const debouncedSave = (newTitle: string, newContent: string, type?: string, tags?: string[], src?: string) => {
        setIsSaving(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            await onUpdate(item.id, {
                title: newTitle,
                content: newContent,
                category: type ?? entryType,
                tags: tags ?? tagsRaw(),
                source: src ?? source,
            });
            setIsSaving(false);
        }, 1500);
    };

    const tagsRaw = () => tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        debouncedSave(newTitle, editor?.getHTML() || '');
    };

    const handleTypeChange = (type: string) => {
        const next = entryType === type ? '' : type;
        setEntryType(next);
        debouncedSave(title, editor?.getHTML() || '', next);
    };

    const handleTagsBlur = () => {
        debouncedSave(title, editor?.getHTML() || '', entryType, tagsRaw());
    };

    const handleSourceBlur = () => {
        debouncedSave(title, editor?.getHTML() || '', entryType, tagsRaw(), source);
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Top Bar (Actions & Status) */}
            <div className="absolute top-4 right-8 z-50 flex items-center justify-end gap-2 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto bg-background/50 backdrop-blur-sm p-1 rounded-full border shadow-sm">
                    {isSaving ? <span className="text-[10px] text-muted-foreground animate-pulse px-2">Saving...</span> : <span className="text-[10px] text-muted-foreground opacity-50 px-2">Saved</span>}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Note Options</DropdownMenuLabel>
                            <DropdownMenuItem onClick={handlePromoteToProject} disabled={isPromoting}>
                                <FolderKanban className="mr-2 h-4 w-4 text-primary" />
                                <span>Promote to Project</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                                const blob = new Blob([item.content || ''], { type: 'text/markdown' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${item.title || 'Untitled'}.md`;
                                a.click();
                            }}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Export Markdown</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                                if (onDelete) {
                                    onDelete(item.id);
                                }
                            }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Note</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <div className="p-2 text-[10px] text-muted-foreground space-y-1 bg-muted/30 rounded-md m-1">
                                <div className="flex justify-between">
                                    <span>Created</span>
                                    <span>{format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Updated</span>
                                    <span>{item.updated_at ? format(new Date(item.updated_at), 'MMM d, yyyy h:mm a') : '-'}</span>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div
                className="flex-grow overflow-y-auto cursor-text"
                onClick={(e) => {
                    // Only focus if clicking the background wrapper, not the textarea or inner contents
                    if (e.target === e.currentTarget) {
                        editor.commands.focus();
                    }
                }}
            >
                <div className="max-w-3xl mx-auto pt-12 pb-12 px-12" onClick={(e) => {
                    // Same here for the inner wrapper
                    if (e.target === e.currentTarget) {
                        editor.commands.focus();
                    }
                }}>
                    <TextareaAutosize
                        value={title}
                        onChange={(e) => handleTitleChange(e as any)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                editor?.commands.focus();
                            }
                        }}
                        placeholder="Untitled"
                        className="w-full resize-none bg-transparent text-5xl font-bold font-serif focus:outline-none placeholder:text-muted-foreground/30 mb-4"
                    />

                    {/* ── Meta row: type chips + source ── */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        {/* Entry type chips */}
                        {ENTRY_TYPES.map(t => (
                            <button
                                key={t}
                                onClick={() => handleTypeChange(t)}
                                className={cn(
                                    'text-xs px-2.5 py-0.5 rounded-full border transition-all font-medium',
                                    entryType === t
                                        ? typeColors[t as EntryType]
                                        : 'border-border/40 text-muted-foreground hover:border-border'
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* ── Tags row ── */}
                    <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <Input
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            onBlur={handleTagsBlur}
                            placeholder="Tags, comma-separated…"
                            className="h-7 text-xs border-none shadow-none bg-transparent focus-visible:ring-0 px-0 text-muted-foreground placeholder:text-muted-foreground/40"
                        />
                    </div>

                    {/* ── Source row (only for Quote/Clipping/Reference) ── */}
                    {(entryType === 'Quote' || entryType === 'Clipping' || entryType === 'Reference') && (
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-[10px] text-muted-foreground shrink-0">Source</span>
                            <Input
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                onBlur={handleSourceBlur}
                                placeholder="Book, article, person, URL…"
                                className="h-7 text-xs border-none shadow-none bg-transparent focus-visible:ring-0 px-0 text-muted-foreground placeholder:text-muted-foreground/40"
                            />
                        </div>
                    )}

                    <EditorContent editor={editor} />
                    <ItemLinker itemId={item.id} itemType="Garden" />
                </div>
            </div>
        </div>
    );
};

export default GardenEditor;
