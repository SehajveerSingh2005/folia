"use client";

import React from 'react';
import { Clock, CheckSquare, FolderKanban, Inbox, Target, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Widget = ({
    title,
    icon,
    children,
    className,
    delay = 0,
}: {
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) => (
    <div
        className={cn(
            'bg-card border border-border/60 rounded-xl p-4 shadow-sm',
            'animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both',
            className
        )}
        style={{ animationDelay: `${delay}ms` }}
    >
        {title && (
            <div className="flex items-center gap-2 mb-3">
                {icon && <span className="text-primary">{icon}</span>}
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            </div>
        )}
        {children}
    </div>
);

const DashboardMockup: React.FC = () => {
    return (
        <div className="bg-background p-4 rounded-2xl">
            {/* Mock window chrome */}
            <div className="flex items-center gap-1.5 mb-4">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                <div className="ml-3 text-[10px] text-muted-foreground/50 font-mono">Dashboard</div>
            </div>

            {/* Grid layout */}
            <div className="grid grid-cols-12 gap-2.5 text-sm">
                {/* Welcome Widget */}
                <Widget className="col-span-5" delay={50}>
                    <p className="text-base font-serif font-medium">Good morning, Alex.</p>
                    <p className="text-xs text-muted-foreground mt-1">3 tasks due today.</p>
                </Widget>

                {/* Clock Widget */}
                <Widget className="col-span-4" icon={<Clock className="h-3 w-3" />} title="Clock" delay={150}>
                    <p className="text-2xl font-mono font-light text-foreground/80">9:41</p>
                    <p className="text-[10px] text-muted-foreground">Thu, Feb 20</p>
                </Widget>

                {/* Placeholder filler */}
                <Widget className="col-span-3 flex items-center justify-center" delay={200}>
                    <div className="text-center">
                        <div className="h-6 w-6 rounded-full bg-primary/20 mx-auto mb-1 flex items-center justify-center">
                            <Target className="h-3 w-3 text-primary" />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Goals</p>
                    </div>
                </Widget>

                {/* Due Today Widget */}
                <Widget className="col-span-5" icon={<CheckSquare className="h-3 w-3" />} title="Due Today" delay={250}>
                    <div className="space-y-2">
                        {[
                            { done: true, text: 'Review design proposal' },
                            { done: false, text: 'Write blog post draft' },
                            { done: false, text: 'Team standup at 10am' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={cn(
                                    'h-3.5 w-3.5 rounded flex-shrink-0 flex items-center justify-center',
                                    item.done ? 'bg-primary' : 'border border-border'
                                )}>
                                    {item.done && <Check className="h-2 w-2 text-primary-foreground" />}
                                </div>
                                <p className={cn('text-[11px]', item.done && 'line-through text-muted-foreground')}>
                                    {item.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </Widget>

                {/* Flow Widget */}
                <Widget className="col-span-7" icon={<FolderKanban className="h-3 w-3" />} title="Flow" delay={350}>
                    <div className="space-y-1.5">
                        {[
                            { name: 'Website Redesign', pct: 70 },
                            { name: 'Italian Trip Planning', pct: 35 },
                            { name: 'Learn Rust', pct: 20 },
                        ].map((proj, i) => (
                            <div key={i}>
                                <div className="flex justify-between mb-0.5">
                                    <p className="text-[11px]">{proj.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{proj.pct}%</p>
                                </div>
                                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary/60 rounded-full"
                                        style={{ width: `${proj.pct}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Widget>

                {/* Inbox Widget */}
                <Widget className="col-span-12" icon={<Inbox className="h-3 w-3" />} title="Inbox" delay={450}>
                    <div className="flex gap-2">
                        {['Buy new keyboard', 'Research flight options', 'Schedule dentist'].map((item, i) => (
                            <div key={i} className="flex-1 bg-secondary/40 rounded-lg px-2.5 py-1.5">
                                <p className="text-[11px] text-foreground/80">{item}</p>
                            </div>
                        ))}
                    </div>
                </Widget>
            </div>
        </div>
    );
};

export default DashboardMockup;
