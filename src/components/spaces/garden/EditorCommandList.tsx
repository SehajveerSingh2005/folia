import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code } from "lucide-react";

interface CommandListProps {
    items: any[];
    command: (item: any) => void;
}

export const EditorCommandList = forwardRef((props: CommandListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === "ArrowUp") {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === "ArrowDown") {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === "Enter") {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    return (
        <div className="z-50 min-w-[300px] h-auto rounded-xl border border-border/40 bg-popover/95 backdrop-blur-xl p-1.5 text-popover-foreground shadow-2xl transition-all overflow-hidden">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-1 select-none">
                Suggestions
            </div>
            {props.items.length > 0 ? (
                <div className="flex flex-col gap-1">
                    {props.items.map((item, index) => (
                        <button
                            key={index}
                            className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm outline-none text-left transition-colors
                ${index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground text-foreground/80"}
              `}
                            onClick={() => selectItem(index)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {item.element || (
                                <>
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background shadow-sm text-foreground/70">
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col items-start leading-tight">
                                        <p className="font-semibold text-sm">{item.title}</p>
                                        <p className="text-[11px] text-muted-foreground opacity-80">{item.description}</p>
                                    </div>
                                </>
                            )}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                    No results found.
                </div>
            )}
        </div>
    );
});

EditorCommandList.displayName = "EditorCommandList";

export const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        {
            title: "Heading 1",
            description: "Big section heading",
            icon: <Heading1 className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
            },
        },
        {
            title: "Heading 2",
            description: "Medium section heading",
            icon: <Heading2 className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
            },
        },
        {
            title: "Heading 3",
            description: "Small section heading",
            icon: <Heading3 className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
            },
        },
        {
            title: "Bullet List",
            description: "Create a simple bullet list",
            icon: <List className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: "Numbered List",
            description: "Create a numbered list",
            icon: <ListOrdered className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: "Blockquote",
            description: "Capture a quote",
            icon: <Quote className="h-4 w-4" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
    ].filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()));
};
