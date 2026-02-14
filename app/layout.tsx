
import type { Metadata } from 'next'
import '@/globals.css'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/ThemeProvider"
import { QueryClientProvider } from '@/components/QueryClientProvider' // Need to create this separate client component

export const metadata: Metadata = {
    title: 'Folia',
    description: 'A home for your thoughts, projects, and days.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased font-sans">
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <QueryClientProvider>
                        <TooltipProvider>
                            {children}
                            <Toaster />
                            <Sonner />
                        </TooltipProvider>
                    </QueryClientProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
