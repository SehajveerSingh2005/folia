"use client";

import React from 'react';
import { Telescope, Star, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const goals = [
    {
        title: 'Launch a SaaS product',
        sub: ['Research market gap', 'Build MVP', 'Find first 10 customers'],
        color: 'bg-primary/15 border-primary/20',
    },
    {
        title: 'Learn Japanese (N3 level)',
        sub: ['Complete Duolingo tree', 'Watch 5 shows without subs', 'Pass JLPT N3'],
        color: 'bg-secondary border-border/40',
    },
    {
        title: 'Run a half-marathon',
        sub: ['Build base with 5K runs', 'Follow 12-week plan', 'Race day'],
        color: 'bg-secondary border-border/40',
    },
];

const HorizonMockup: React.FC = () => {
    return (
        <div className="bg-background p-5 rounded-2xl">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
                <Telescope className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Horizon</p>
                <div className="ml-auto">
                    <div className="flex items-center gap-1 text-muted-foreground/60 bg-secondary/50 rounded-full px-2.5 py-1">
                        <Star className="h-2.5 w-2.5" />
                        <span className="text-[10px]">3 goals</span>
                    </div>
                </div>
            </div>

            {/* Goals */}
            <div className="space-y-3">
                {goals.map((goal, i) => (
                    <div
                        key={i}
                        className={cn(
                            'border rounded-xl p-3.5',
                            goal.color
                        )}
                    >
                        <p className="text-xs font-medium mb-2">{goal.title}</p>
                        <div className="space-y-1 ml-2 border-l-2 border-border/40 pl-3">
                            {goal.sub.map((s, j) => (
                                <div key={j} className="flex items-center gap-2">
                                    <div className={cn(
                                        'h-2 w-2 rounded-full flex-shrink-0',
                                        j === 0 && i === 0 ? 'bg-primary' : 'border border-border'
                                    )} />
                                    <p className="text-[10px] text-muted-foreground">{s}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HorizonMockup;
