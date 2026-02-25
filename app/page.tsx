'use client';

import Image from 'next/image';

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import {
    ArrowRight,
    FolderKanban,
    Sparkles,
    Book,
    Telescope,
    Inbox,
    Wand2,
    LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Landing Components
import SpaceStorySection from "@/components/landing/SpaceStorySection";
import DashboardMockup from "@/components/landing/DashboardMockup";
import GardenEditorMockup from "@/components/landing/GardenEditorMockup";
import AIPlannerTeaser from "@/components/landing/AIPlannerTeaser";
import FlowMockup from "@/components/landing/FlowMockup";
import JournalMockup from "@/components/landing/JournalMockup";
import HorizonMockup from "@/components/landing/HorizonMockup";

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session) {
                router.replace('/dashboard');
            }
        };
        checkSession();
    }, [router]);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">

            {/* ── Header ── */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-14 flex items-center justify-between max-w-6xl">
                    <div className="flex items-center gap-2.5">
                        <Image src="/logo.png" alt="Folia" width={80} height={32} className="h-8 w-auto object-contain dark:brightness-0 dark:invert" priority />
                        <span className="text-lg font-serif font-medium tracking-tight">Folia</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                        <a href="#spaces" className="hover:text-foreground transition-colors">Spaces</a>
                        <a href="#ai" className="hover:text-foreground transition-colors">AI Planner</a>
                        <a href="#cta" className="hover:text-foreground transition-colors">Get started</a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/login">Log In</Link>
                        </Button>
                        <Button asChild size="sm" className="rounded-full px-5">
                            <Link href="/login">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-grow">

                {/* ── Hero ── */}
                <section className="relative pt-36 pb-16 sm:pt-44 sm:pb-20 overflow-hidden">
                    {/* Subtle radial glow */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-30 pointer-events-none"
                        style={{
                            background:
                                "radial-gradient(ellipse at center, hsl(var(--primary)/0.3) 0%, transparent 70%)",
                        }}
                    />

                    <div className="container mx-auto px-6 max-w-6xl relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <ScrollFadeIn>
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-8 border border-primary/15">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                    A personal OS for your whole life
                                </div>
                            </ScrollFadeIn>
                            <ScrollFadeIn delay={100}>
                                <h1 className="text-5xl md:text-7xl font-serif font-normal leading-[1.1] mb-6">
                                    Everything you think,
                                    <br />
                                    <span className="text-primary">plan, and live.</span>
                                </h1>
                            </ScrollFadeIn>
                            <ScrollFadeIn delay={250}>
                                <p className="text-lg md:text-xl text-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                                    Folia gives every part of your life its own space — projects, notes, daily reflections, long-term goals — all in one calm, organized home.
                                </p>
                            </ScrollFadeIn>
                            <ScrollFadeIn delay={400}>
                                <div className="flex items-center justify-center gap-4 flex-wrap">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="rounded-full px-8 py-6 text-base font-medium shadow-sm"
                                    >
                                        <Link href="/login">
                                            Start for free
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <a
                                        href="#spaces"
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                                    >
                                        See how it works
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            </ScrollFadeIn>
                        </div>

                        {/* Hero Dashboard Preview */}
                        <ScrollFadeIn delay={500}>
                            <div className="relative max-w-4xl mx-auto">
                                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                                <div className="rounded-2xl border border-border/60 shadow-2xl overflow-hidden">
                                    <DashboardMockup />
                                </div>
                            </div>
                        </ScrollFadeIn>
                    </div>
                </section>

                {/* ── Bridge / Chapter Title ── */}
                <section className="py-20 bg-secondary/20">
                    <div className="container mx-auto px-6 max-w-3xl text-center">
                        <ScrollFadeIn>
                            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4 font-medium">
                                A space for everything
                            </p>
                            <h2 className="text-3xl md:text-4xl font-serif leading-snug text-foreground/90">
                                Most apps give you one thing.
                                <br />
                                <span className="text-foreground">Your life needs all of it.</span>
                            </h2>
                            <p className="text-base text-muted-foreground mt-5 leading-relaxed">
                                Folia's spaces work together seamlessly — each one purpose-built, all connected under one roof.
                            </p>
                        </ScrollFadeIn>

                        {/* Space pills */}
                        <ScrollFadeIn delay={200}>
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-10" id="spaces">
                                {[
                                    { icon: LayoutDashboard, label: 'Dashboard' },
                                    { icon: FolderKanban, label: 'Flow' },
                                    { icon: Sparkles, label: 'Garden' },
                                    { icon: Book, label: 'Journal' },
                                    { icon: Telescope, label: 'Horizon' },
                                    { icon: Inbox, label: 'Loom' },
                                ].map(({ icon: Icon, label }) => (
                                    <div
                                        key={label}
                                        className="flex items-center gap-2 bg-background border border-border/60 rounded-full px-4 py-2 text-sm font-medium shadow-sm"
                                    >
                                        <Icon className="h-3.5 w-3.5 text-primary" />
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </ScrollFadeIn>
                    </div>
                </section>

                {/* ── Dashboard section ── */}
                <SpaceStorySection
                    eyebrow="Command Center"
                    title="Your day, at a glance."
                    description="Start every morning with your personal Dashboard. Drag-and-drop widgets that matter to you — upcoming tasks, active projects, a quick note, your current mood. Yours to design."
                    direction="right"
                    visual={<DashboardMockup />}
                />

                {/* ── Flow ── */}
                <SpaceStorySection
                    eyebrow="Flow · Projects"
                    title="Bring your projects to life."
                    description="Flow is where your active endeavors live. Break any goal into tasks, assign due dates, and track progress. Whether you're launching a product or learning a skill, Flow keeps you moving."
                    direction="left"
                    visual={<FlowMockup />}
                    className="bg-secondary/10"
                />

                {/* ── Garden (text editor, dark bg) ── */}
                <section className="py-20 sm:py-28 overflow-hidden bg-foreground">
                    <div className="container mx-auto px-6 max-w-6xl">
                        <div className="flex flex-col gap-12 lg:gap-16 items-center lg:flex-row-reverse">
                            {/* Text */}
                            <div className="flex-1 max-w-lg">
                                <ScrollFadeIn>
                                    <p className="text-xs tracking-widest uppercase font-medium mb-4 text-background/50">
                                        Garden · Notes
                                    </p>
                                    <h2 className="text-4xl md:text-5xl font-serif font-normal mb-5 leading-tight text-background">
                                        A dedicated space to think and write.
                                    </h2>
                                    <p className="text-lg leading-relaxed text-background/70">
                                        Garden is your rich text writing space. Create notes, capture ideas, and write long-form with a clean, distraction-free editor. Slash commands, formatting, and auto-save — all built in.
                                    </p>
                                    <div className="mt-6 flex items-start gap-3 bg-background/8 border border-background/10 rounded-xl p-4">
                                        <div className="flex gap-0.5 mt-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-1.5 w-1.5 rounded-full bg-primary"
                                                    style={{ opacity: 0.3 + i * 0.15 }}
                                                />
                                            ))}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-background/80">Constellation View — coming soon</p>
                                            <p className="text-xs text-background/50 mt-0.5">
                                                Visualize how your notes connect across a living, interactive galaxy of ideas.
                                            </p>
                                        </div>
                                    </div>
                                </ScrollFadeIn>
                            </div>

                            {/* Visual */}
                            <div className="flex-1 w-full max-w-lg">
                                <ScrollFadeIn delay={200}>
                                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-background/10">
                                        <GardenEditorMockup />
                                    </div>
                                </ScrollFadeIn>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Journal ── */}
                <SpaceStorySection
                    eyebrow="Journal · Daily Reflection"
                    title="Chronicle your days. Track your growth."
                    description="Journal is your private, pressure-free space for daily reflection. Log your mood, write about your day, and import completed tasks to see a real picture of your progress over time."
                    direction="right"
                    visual={<JournalMockup />}
                />

                {/* ── Horizon ── */}
                <SpaceStorySection
                    eyebrow="Horizon · Long-term Goals"
                    title="Dream in decades, not just days."
                    description="Horizon holds your big, bold ambitions — things you're working toward over months and years. Build goal trees with nested milestones. Keep your north star always in view."
                    direction="left"
                    visual={<HorizonMockup />}
                    className="bg-secondary/10"
                />

                {/* ── AI Planner ── */}
                <section id="ai" className="py-20 sm:py-32 bg-background overflow-hidden">
                    <div className="container mx-auto px-6 max-w-6xl">
                        <div className="text-center max-w-2xl mx-auto mb-14">
                            <ScrollFadeIn>
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-primary/15">
                                    <Wand2 className="h-3 w-3" />
                                    AI Planner
                                </div>
                                <h2 className="text-4xl md:text-5xl font-serif mb-5">
                                    Describe a goal.
                                    <br />
                                    <span className="text-primary">Watch Folia plan it.</span>
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Just describe what you want to achieve. Our AI planner breaks it into a full project in your Flow — complete with tasks, steps, and deadlines — in seconds.
                                </p>
                            </ScrollFadeIn>
                        </div>
                        <ScrollFadeIn delay={200}>
                            <AIPlannerTeaser />
                        </ScrollFadeIn>
                    </div>
                </section>

                {/* ── Quote / Philosophy ── */}
                <section className="py-20 bg-secondary/20 border-y border-border/40">
                    <div className="container mx-auto px-6 max-w-3xl text-center">
                        <ScrollFadeIn>
                            <p className="text-2xl md:text-3xl font-serif text-foreground/85 leading-relaxed italic">
                                "Clarity is not about having fewer things to do. It's about always knowing{" "}
                                <span className="not-italic text-foreground">what to do next.</span>"
                            </p>
                            <p className="text-sm text-muted-foreground mt-6">— What Folia is built around</p>
                        </ScrollFadeIn>
                    </div>
                </section>

                {/* ── Final CTA ── */}
                <section
                    id="cta"
                    className="py-24 sm:py-32 bg-primary text-primary-foreground relative overflow-hidden"
                >
                    {/* Decorative rings */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-primary-foreground/5" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-primary-foreground/8" />
                    </div>

                    <div className="container mx-auto px-6 max-w-3xl text-center relative z-10">
                        <ScrollFadeIn>
                            <h2 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
                                Ready to live more organized?
                            </h2>
                        </ScrollFadeIn>
                        <ScrollFadeIn delay={150}>
                            <p className="text-lg md:text-xl text-primary-foreground/75 mb-10 max-w-xl mx-auto leading-relaxed">
                                Start building your calm, organized digital home today. Free to get started — no credit card needed.
                            </p>
                        </ScrollFadeIn>
                        <ScrollFadeIn delay={300}>
                            <Button
                                asChild
                                size="lg"
                                variant="secondary"
                                className="rounded-full px-10 py-6 text-lg font-medium shadow-md hover:shadow-lg transition-shadow"
                            >
                                <Link href="/login">
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </ScrollFadeIn>
                    </div>
                </section>

            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-border/40 py-8 bg-background">
                <div className="container mx-auto px-6 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2.5">
                        <Image src="/logo.png" alt="Folia" width={64} height={24} className="h-6 w-auto object-contain dark:brightness-0 dark:invert" />
                        <span className="font-serif font-medium text-foreground">Folia</span>
                        <span className="text-border">·</span>
                        <span>Your personal OS</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hover:text-foreground transition-colors">Log In</Link>
                        <Link href="/login" className="hover:text-foreground transition-colors">Sign Up</Link>
                    </div>
                </div>
            </footer>

        </div>
    );
}
