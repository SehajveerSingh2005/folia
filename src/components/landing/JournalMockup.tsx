"use client";

import React from 'react';
import { Book, Smile, Meh, Frown } from 'lucide-react';

const moods = [
    { label: 'Great', icon: Smile, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Okay', icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'Rough', icon: Frown, color: 'text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' },
];

const entries = [
    { date: 'Feb 20', mood: 0, snippet: "Finished the landing page design — it came out better than I imagined. Feeling really good about the direction this project is heading..." },
    { date: 'Feb 19', mood: 1, snippet: "Worked through some tricky bugs. Day felt long but productive. Sometimes that's just how it goes." },
    { date: 'Feb 18', mood: 0, snippet: "Had a great call with the team. Alignment on all fronts. Celebrated with a long walk in the evening." },
];

const JournalMockup: React.FC = () => {
    return (
        <div className="bg-background p-5 rounded-2xl">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
                <Book className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Journal</p>
                <div className="ml-auto flex gap-1">
                    {moods.map((m, i) => (
                        <div key={i} className={`${m.bg} rounded-full p-1`}>
                            <m.icon className={`h-3 w-3 ${m.color}`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Entries */}
            <div className="space-y-3">
                {entries.map((entry, i) => {
                    const Mood = moods[entry.mood];
                    return (
                        <div
                            key={i}
                            className="border border-border/50 rounded-xl p-3 bg-card hover:border-border transition-colors cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-medium text-muted-foreground">{entry.date}</p>
                                <div className={`flex items-center gap-1 ${Mood.bg} rounded-full px-2 py-0.5`}>
                                    <Mood.icon className={`h-2.5 w-2.5 ${Mood.color}`} />
                                    <span className={`text-[9px] font-medium ${Mood.color}`}>{Mood.label}</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-foreground/75 leading-relaxed line-clamp-2 italic">
                                "{entry.snippet}"
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default JournalMockup;
