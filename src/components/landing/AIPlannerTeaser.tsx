"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Wand2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROMPT = "Plan a two-week trip to Japan, focusing on food, history, and nature.";

const TASKS = [
    "Research best time to visit Kyoto",
    "Book round-trip flights to Tokyo",
    "Reserve a Ryokan inn in Hakone",
    "Plan day trip to Nara deer park",
    "Book a ramen-making class in Osaka",
    "Create a daily itinerary doc",
];

type Phase = 'typing' | 'loading' | 'revealing' | 'idle' | 'fadeout';

const AIPlannerTeaser: React.FC = () => {
    const [typedText, setTypedText] = useState('');
    const [phase, setPhase] = useState<Phase>('typing');
    const [visibleTasks, setVisibleTasks] = useState(0);
    const [resultOpacity, setResultOpacity] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const schedule = (fn: () => void, ms: number) => {
        timerRef.current = setTimeout(fn, ms);
    };

    useEffect(() => {
        // Typing phase
        if (phase === 'typing') {
            if (typedText.length < PROMPT.length) {
                schedule(() => {
                    setTypedText(PROMPT.slice(0, typedText.length + 1));
                }, 30 + Math.random() * 20); // natural variation
            } else {
                schedule(() => setPhase('loading'), 700);
            }
        }

        // Loading → reveal
        if (phase === 'loading') {
            schedule(() => {
                setPhase('revealing');
                setResultOpacity(0);
                setVisibleTasks(0);
                // Fade result in
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => setResultOpacity(1));
                });
            }, 1400);
        }

        // Reveal tasks one by one
        if (phase === 'revealing') {
            if (visibleTasks < TASKS.length) {
                schedule(() => setVisibleTasks(v => v + 1), 220);
            } else {
                schedule(() => setPhase('idle'), 3800);
            }
        }

        // Idle → fade out → reset
        if (phase === 'idle') {
            schedule(() => setPhase('fadeout'), 200);
        }

        if (phase === 'fadeout') {
            setResultOpacity(0);
            schedule(() => {
                setTypedText('');
                setVisibleTasks(0);
                setPhase('typing');
            }, 700);
        }

        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, typedText, visibleTasks]);

    const showResult = phase === 'revealing' || phase === 'idle' || phase === 'fadeout';

    return (
        <div className="bg-background p-5 rounded-2xl border border-border/60 shadow-lg max-w-lg mx-auto">
            {/* Mock window chrome */}
            <div className="flex items-center gap-1.5 mb-4">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                <div className="ml-3 text-[10px] text-muted-foreground/50 font-mono">AI Planner</div>
            </div>

            {/* Prompt input */}
            <div className="bg-secondary/40 border border-border rounded-xl px-4 py-3 mb-4 min-h-[64px]">
                <p className="text-sm text-foreground/80 min-h-[1.5em]">
                    {typedText}
                    {phase === 'typing' && (
                        <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                    )}
                </p>
            </div>

            {/* Generate button */}
            <button
                className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 bg-primary text-primary-foreground',
                )}
            >
                <Wand2 className={cn("h-4 w-4 transition-transform duration-300", phase === 'loading' && "animate-spin")} />
                {phase === 'loading' ? 'Generating...' : 'Generate Plan'}
            </button>

            {/* Generated result */}
            <div
                className="overflow-hidden transition-all duration-700 ease-in-out"
                style={{
                    maxHeight: showResult ? `${20 + TASKS.length * 36}px` : '0px',
                    opacity: resultOpacity,
                    transition: 'max-height 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.6s ease',
                }}
            >
                <div className="border-t border-border/60 mt-4 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Japan Adventure · 14 tasks generated
                        </p>
                    </div>
                    <div className="space-y-2">
                        {TASKS.map((task, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 transition-all duration-500 ease-out"
                                style={{
                                    opacity: i < visibleTasks ? 1 : 0,
                                    transform: i < visibleTasks ? 'translateY(0)' : 'translateY(6px)',
                                    transitionDelay: `${i * 30}ms`,
                                }}
                            >
                                <div className="h-4 w-4 rounded border border-border flex-shrink-0 flex items-center justify-center">
                                    {i < 2 && <Check className="h-2.5 w-2.5 text-primary" />}
                                </div>
                                <p className={cn(
                                    "text-xs",
                                    i < 2 ? 'line-through text-muted-foreground' : 'text-foreground/80'
                                )}>
                                    {task}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIPlannerTeaser;
