import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link as LinkIcon, Check, Globe } from 'lucide-react';

interface EmbedWidgetProps {
    data: { url?: string; title?: string };
    onUpdate: (data: { url?: string; title?: string }) => void;
    isEditable: boolean;
}

const EmbedWidget = ({ data, onUpdate, isEditable }: EmbedWidgetProps) => {
    const [isEditing, setIsEditing] = useState(!data.url);
    const [urlInput, setUrlInput] = useState(data.url || '');

    const handleSave = () => {
        // Simple validation/transformation could go here (e.g. converting youtube watch to embed)
        let finalUrl = urlInput;
        if (finalUrl.includes('youtube.com/watch?v=')) {
            finalUrl = finalUrl.replace('watch?v=', 'embed/');
        } else if (finalUrl.includes('youtu.be/')) {
            finalUrl = finalUrl.replace('youtu.be/', 'youtube.com/embed/');
        }

        onUpdate({ ...data, url: finalUrl });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg">
                <div className="w-full space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <LinkIcon className="h-3 w-3" /> Embed URL
                    </label>
                    <div className="flex gap-2">
                        <Input
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="YouTube, Spotify..."
                            className="h-8 text-xs"
                        />
                        <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0">
                            <Check className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">Supports iframe-friendly URLs</p>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative h-full w-full overflow-hidden bg-card">
            {data.url ? (
                <iframe
                    src={data.url}
                    title={data.title || 'Embed'}
                    className="h-full w-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <Globe className="h-8 w-8 opacity-20" />
                </div>
            )}

            {/* Edit Overlay */}
            <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${isEditable ? 'block' : 'hidden'}`}>
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)} className="h-6 text-xs bg-background/80 backdrop-blur-sm">
                    Change
                </Button>
            </div>
        </div>
    );
};

export default EmbedWidget;
