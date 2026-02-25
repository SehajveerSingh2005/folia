"use client";

import React from 'react';
import { Check, FolderKanban, Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const FlowMockup: React.FC = () => {
    const tasks = [
        { text: 'Finalize color palette', done: true, due: 'Feb 18', tag: 'Design' },
        { text: 'Build landing page hero section', done: true, due: 'Feb 19', tag: 'Dev' },
        { text: 'Write copy for features page', done: false, due: 'Feb 21', tag: 'Content', current: true },
        { text: 'Set up analytics', done: false, due: 'Feb 23', tag: 'Dev' },
        { text: 'Launch beta to testers', done: false, due: 'Feb 28', tag: 'Launch' },
    ];

    return (
        <div className="bg-background p-5 rounded-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <FolderKanban className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-medium">Website Redesign</p>
                    <p className="text-[10px] text-muted-foreground">3 of 5 tasks complete</p>
                </div>
                <div className="ml-auto">
                    <div className="h-1.5 w-20 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: '60%' }} />
                    </div>
                </div>
            </div>

            {/* Task list */}
            <div className="space-y-2">
                {tasks.map((task, i) => (
                    <div
                        key={i}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                            task.current ? 'bg-primary/8 border border-primary/20' : 'hover:bg-secondary/30'
                        )}
                    >
                        <div
                            className={cn(
                                'h-4 w-4 rounded flex-shrink-0 flex items-center justify-center',
                                task.done ? 'bg-primary' : 'border-2 border-border'
                            )}
                        >
                            {task.done && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                        </div>
                        <p className={cn(
                            'text-xs flex-1',
                            task.done && 'line-through text-muted-foreground'
                        )}>
                            {task.text}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary/60 text-muted-foreground">
                                {task.tag}
                            </span>
                            <div className="flex items-center gap-0.5 text-muted-foreground/60">
                                <Calendar className="h-2.5 w-2.5" />
                                <span className="text-[9px]">{task.due}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FlowMockup;
