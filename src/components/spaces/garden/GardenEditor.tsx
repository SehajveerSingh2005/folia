import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextareaAutosize from 'react-textarea-autosize';
import { useState, useEffect, useRef } from 'react';
import { GardenItem } from './NoteList';
import { MoreHorizontal, Download, Trash2, Info, Settings } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { SlashCommand } from './SlashCommand';

interface GardenEditorProps {
    item: GardenItem;
    onUpdate: (id: string, data: Partial<GardenItem>) => Promise<void>;
}

const GardenEditor = ({ item, onUpdate }: GardenEditorProps) => {
    const [title, setTitle] = useState(item.title || '');
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    const debouncedSave = (newTitle: string, newContent: string) => {
        setIsSaving(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            await onUpdate(item.id, { title: newTitle, content: newContent });
            setIsSaving(false);
        }, 1500);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        debouncedSave(newTitle, editor?.getHTML() || '');
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
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
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

            <div className="flex-grow overflow-y-auto cursor-text" onClick={() => editor.commands.focus()}>
                <div className="max-w-3xl mx-auto pt-12 pb-12 px-12">
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
                        className="w-full resize-none bg-transparent text-5xl font-bold font-serif focus:outline-none placeholder:text-muted-foreground/30 mb-8"
                    />
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
};

export default GardenEditor;
