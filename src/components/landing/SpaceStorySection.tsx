"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import ScrollFadeIn from '@/components/ScrollFadeIn';

interface SpaceStorySectionProps {
    eyebrow?: string;
    title: string;
    description: string;
    visual: React.ReactNode;
    direction?: 'left' | 'right';
    darkBg?: boolean;
    className?: string;
    badge?: React.ReactNode;
}

const SpaceStorySection: React.FC<SpaceStorySectionProps> = ({
    eyebrow,
    title,
    description,
    visual,
    direction = 'right',
    darkBg = false,
    className,
    badge,
}) => {
    const isTextLeft = direction === 'left';

    return (
        <section
            className={cn(
                'py-20 sm:py-28 overflow-hidden',
                darkBg
                    ? 'bg-foreground text-background'
                    : 'bg-background',
                className
            )}
        >
            <div className="container mx-auto px-6 max-w-6xl">
                <div
                    className={cn(
                        'flex flex-col gap-12 lg:gap-16 items-center',
                        isTextLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'
                    )}
                >
                    {/* Text Column */}
                    <div className="flex-1 max-w-lg">
                        <ScrollFadeIn>
                            {eyebrow && (
                                <p
                                    className={cn(
                                        'text-xs tracking-widest uppercase font-medium mb-4',
                                        darkBg ? 'text-background/50' : 'text-primary/70'
                                    )}
                                >
                                    {eyebrow}
                                </p>
                            )}
                            <h2
                                className={cn(
                                    'text-4xl md:text-5xl font-serif font-normal mb-5 leading-tight',
                                    darkBg ? 'text-background' : 'text-foreground'
                                )}
                            >
                                {title}
                            </h2>
                            <p
                                className={cn(
                                    'text-lg leading-relaxed',
                                    darkBg ? 'text-background/70' : 'text-foreground/70'
                                )}
                            >
                                {description}
                            </p>
                            {badge && <div className="mt-6">{badge}</div>}
                        </ScrollFadeIn>
                    </div>

                    {/* Visual Column */}
                    <div className="flex-1 w-full max-w-lg">
                        <ScrollFadeIn delay={200}>
                            <div
                                className={cn(
                                    'rounded-2xl overflow-hidden shadow-2xl border',
                                    darkBg
                                        ? 'border-background/10'
                                        : 'border-border/60'
                                )}
                            >
                                {visual}
                            </div>
                        </ScrollFadeIn>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SpaceStorySection;
