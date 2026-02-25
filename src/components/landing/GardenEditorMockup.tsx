"use client";

import React from 'react';
import { Sparkles, MoreHorizontal, Hash, Bold, Italic, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const GardenEditorMockup: React.FC = () => {
    return (
        <div className="bg-card flex h-[420px] overflow-hidden rounded-2xl">
            {/* Sidebar */}
            <div className="w-44 border-r border-border/60 bg-secondary/20 flex flex-col p-3 gap-1 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[11px] font-medium text-foreground/80">Garden</span>
                    </div>
                    <div className="h-4 w-4 rounded flex items-center justify-center hover:bg-secondary cursor-pointer">
                        <span className="text-muted-foreground text-sm leading-none">+</span>
                    </div>
                </div>
                {[
                    { title: 'Thoughts on Design', active: true, date: 'Feb 20' },
                    { title: 'Learning to Code', active: false, date: 'Feb 18' },
                    { title: 'Weekend trip ideas', active: false, date: 'Feb 15' },
                    { title: 'Book notes — Atomic Habits', active: false, date: 'Feb 12' },
                    { title: 'Career reflections', active: false, date: 'Feb 8' },
                ].map((note, i) => (
                    <div
                        key={i}
                        className={cn(
                            'px-2 py-2 rounded-lg cursor-pointer',
                            note.active
                                ? 'bg-primary/10 text-foreground'
                                : 'text-muted-foreground hover:bg-secondary/50'
                        )}
                    >
                        <p className={cn('text-[11px] font-medium truncate', note.active && 'text-foreground')}>
                            {note.title}
                        </p>
                        <p className="text-[9px] text-muted-foreground/70 mt-0.5">{note.date}</p>
                    </div>
                ))}
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-border/40">
                    {[Bold, Italic, List, Hash].map((Icon, i) => (
                        <div
                            key={i}
                            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-secondary cursor-pointer"
                        >
                            <Icon className="h-3 w-3" />
                        </div>
                    ))}
                    <div className="ml-auto flex items-center gap-1">
                        <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden px-8 pt-8 pb-4 relative">
                    {/* Title */}
                    <h2 className="text-2xl font-serif font-bold mb-4 text-foreground">
                        Thoughts on Design
                    </h2>

                    {/* Prose content */}
                    <div className="space-y-3 text-[12px] leading-relaxed text-foreground/80">
                        <p>
                            Design isn't just about how things look — it's about how they <em>feel</em> when you use them. The gap between a good product and a great one often comes down to a hundred small decisions.
                        </p>
                        <p>
                            White space is not emptiness. It's breathing room. It's the pause before the punchline.
                        </p>
                        <p className="text-muted-foreground">
                            Typography is a voice. Choose a font that speaks in the right tone — a serif font whispers history and trust, a modern sans-serif says clarity and confidence...
                        </p>
                    </div>

                    {/* Fade out overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />

                    {/* Constellation badge */}
                    <div className="absolute bottom-5 right-5 z-10">
                        <div className="flex items-center gap-1.5 bg-foreground/10 backdrop-blur-sm border border-foreground/10 rounded-full px-3 py-1.5">
                            <div className="flex gap-0.5">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-1 w-1 rounded-full bg-primary"
                                        style={{ opacity: 0.4 + i * 0.3 }}
                                    />
                                ))}
                            </div>
                            <span className="text-[9px] font-medium text-foreground/60">
                                Constellation view · soon
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GardenEditorMockup;
