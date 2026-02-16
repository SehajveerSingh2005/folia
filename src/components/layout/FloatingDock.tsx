"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
    LayoutGrid,
    ClipboardList,
    FolderKanban,
    Sparkles,
    Book,
    Telescope,
    Archive,
    Settings,
    PlusCircle,
    Search
} from 'lucide-react';

const dockItems = [
    { id: 'Overview', icon: LayoutGrid, label: 'Home', path: '/dashboard' },
    { id: 'Loom', icon: ClipboardList, label: 'Loom', path: '/loom' },
    { id: 'Flow', icon: FolderKanban, label: 'Flow', path: '/flow' },
    { id: 'Garden', icon: Sparkles, label: 'Garden', path: '/garden' },
    { id: 'Journal', icon: Book, label: 'Journal', path: '/journal' },
    { id: 'Horizon', icon: Telescope, label: 'Horizon', path: '/horizon' },
    { id: 'Archive', icon: Archive, label: 'Archive', path: '/archive' },
];

export const FloatingDock = ({
    activeView,
    onOpenCreate,
    onSearch,
    onOpenSettings
}: {
    activeView: string;
    onOpenCreate: () => void;
    onSearch: () => void;
    onOpenSettings: () => void;
}) => {
    const mouseX = useMotionValue(Infinity);

    return (
        <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex h-16 items-end gap-4 rounded-2xl border bg-background/80 px-4 pb-3 backdrop-blur-md shadow-2xl dark:border-white/10 dark:bg-black/80"
        >
            {/* Create Button (Special styling) */}
            <DockIcon mouseX={mouseX} onClick={onOpenCreate} label="Create">
                <PlusCircle className="h-full w-full text-primary" />
            </DockIcon>

            <div className="w-px h-8 bg-border self-center mx-1" />

            {dockItems.map((item) => (
                <DockIcon key={item.id} mouseX={mouseX} href={item.path} label={item.label} isActive={activeView === item.id}>
                    <item.icon className={cn("h-full w-full", activeView === item.id ? "text-primary" : "text-muted-foreground")} />
                </DockIcon>
            ))}

            <div className="w-px h-8 bg-border self-center mx-1" />

            {/* Utilities */}
            <DockIcon mouseX={mouseX} onClick={onSearch} label="Search">
                <Search className="h-full w-full text-muted-foreground" />
            </DockIcon>
            <DockIcon mouseX={mouseX} onClick={onOpenSettings} label="Settings">
                <Settings className="h-full w-full text-muted-foreground" />
            </DockIcon>

        </motion.div>
    );
};

function DockIcon({
    mouseX,
    href,
    children,
    onClick,
    label,
    isActive
}: {
    mouseX: any;
    href?: string;
    children: React.ReactNode;
    onClick?: () => void;
    label: string;
    isActive?: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

    const Component = href ? Link : 'button';
    const props = href ? { href } : { onClick };

    return (
        <motion.div
            ref={ref}
            style={{ width, height: width }}
            className="aspect-square relative group"
        >
            {/* @ts-ignore */}
            <Component
                {...props}
                className={cn(
                    "flex h-full w-full items-center justify-center rounded-full bg-secondary/40 border border-transparent transition-colors hover:bg-secondary hover:border-border",
                    isActive && "bg-primary/10 border-primary/20 shadow-[0_0_20px_-5px_var(--primary)]"
                )}
            >
                <motion.div
                    className="h-1/2 w-1/2"
                    style={{ width: '50%', height: '50%' }} // Keep icon relative to container which scales
                >
                    {children}
                </motion.div>
            </Component>

            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden rounded px-2 py-0.5 text-xs text-white bg-black/80 backdrop-blur group-hover:block transition-opacity whitespace-nowrap">
                {label}
            </div>

            {/* Active Dot */}

        </motion.div>
    );
}
