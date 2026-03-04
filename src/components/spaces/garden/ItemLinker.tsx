import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Link2, X, FolderKanban, StickyNote, Loader2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

interface ItemLink {
    id: string;
    source_item_id: string;
    source_item_type: string;
    target_item_id: string;
    target_item_type: string;
    target_item_name?: string; // We'll populate this artificially
}

interface ItemLinkerProps {
    itemId: string;
    itemType: 'Garden' | 'Project';
    hideItems?: boolean;
}

export const ItemLinker = ({ itemId, itemType, hideItems }: ItemLinkerProps) => {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    // 1. Fetch existing links for this item
    const { data: links, isLoading: linksLoading } = useQuery({
        queryKey: ['item_links', itemId],
        queryFn: async () => {
            // Get all links where this item is either source OR target
            const { data, error } = await supabase
                .from('item_links')
                .select('*')
                .or(`source_item_id.eq.${itemId},target_item_id.eq.${itemId}`);

            if (error) throw error;

            // Now we need to fetch the names of the connected items
            const enrichedLinks = await Promise.all(data.map(async (link) => {
                const isSource = link.source_item_id === itemId;
                const otherId = isSource ? link.target_item_id : link.source_item_id;
                const otherType = isSource ? link.target_item_type : link.source_item_type;

                let name = 'Unknown';
                if (otherType === 'Garden') {
                    const { data: note } = await supabase.from('garden_items').select('title').eq('id', otherId).single();
                    if (note) name = note.title || 'Untitled Note';
                } else if (otherType === 'Project') {
                    const { data: project } = await supabase.from('loom_items').select('name').eq('id', otherId).single();
                    if (project) name = project.name || 'Untitled Project';
                }

                return {
                    ...link,
                    // Normalize the link so 'target' conceptually represents the *other* item to the UI
                    display_id: otherId,
                    display_type: otherType,
                    display_name: name
                };
            }));

            return enrichedLinks;
        }
    });

    // 2. Fetch search results (Notes & Projects)
    const { data: searchResults, isLoading: searchLoading } = useQuery({
        queryKey: ['link_search', search],
        queryFn: async () => {
            if (!search.trim()) return [];

            const [{ data: notes }, { data: projects }] = await Promise.all([
                supabase.from('garden_items').select('id, title').ilike('title', `%${search}%`).neq('id', itemId).limit(5),
                supabase.from('loom_items').select('id, name').ilike('name', `%${search}%`).neq('id', itemId).limit(5)
            ]);

            const results = [
                ...(notes || []).map(n => ({ id: n.id, name: n.title || 'Untitled Note', type: 'Garden' })),
                ...(projects || []).map(p => ({ id: p.id, name: p.name || 'Untitled Project', type: 'Project' }))
            ];

            return results;
        },
        enabled: isOpen && search.trim().length > 0
    });

    // 3. Mutations
    const addLinkMutation = useMutation({
        mutationFn: async ({ targetId, targetType }: { targetId: string, targetType: string }) => {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error('You must be logged in to create links.');

            const { error } = await supabase.from('item_links').insert({
                source_item_id: itemId,
                source_item_type: itemType,
                target_item_id: targetId,
                target_item_type: targetType,
                user_id: user.id
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['item_links', itemId] });
            queryClient.invalidateQueries({ queryKey: ['project_linked_notes', itemId] });
            queryClient.invalidateQueries({ queryKey: ['constellation_data'] });
            setIsOpen(false);
            setSearch('');
            showSuccess('Link added.');
        },
        onError: (err: Error) => showError(err.message)
    });

    const removeLinkMutation = useMutation({
        mutationFn: async (linkId: string) => {
            const { error } = await supabase.from('item_links').delete().eq('id', linkId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['item_links', itemId] });
            queryClient.invalidateQueries({ queryKey: ['project_linked_notes', itemId] });
            queryClient.invalidateQueries({ queryKey: ['constellation_data'] });
        },
        onError: (err: Error) => showError(err.message)
    });

    return (
        <div className={hideItems ? "" : "mt-12 pt-8 border-t border-border/50"}>
            <div className={`flex items-center ${hideItems ? 'justify-end' : 'justify-between'} mb-4`}>
                {!hideItems && (
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Link2 className="w-4 h-4" /> Connected Items
                    </h4>
                )}

                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                            <Plus className="w-3 h-3 mr-1" /> Add Link
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-2 border-b">
                            <Input
                                autoFocus
                                placeholder="Search notes or projects..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <ScrollArea className="h-[200px]">
                            {searchLoading ? (
                                <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                            ) : searchResults && searchResults.length > 0 ? (
                                <div className="p-1">
                                    {searchResults.map(result => {
                                        const isAlreadyLinked = links?.some(l => l.display_id === result.id);
                                        return (
                                            <Button
                                                key={result.id}
                                                variant="ghost"
                                                disabled={isAlreadyLinked}
                                                className="w-full justify-start text-sm h-10 px-2 font-normal"
                                                onClick={() => addLinkMutation.mutate({ targetId: result.id, targetType: result.type })}
                                            >
                                                {result.type === 'Garden' ? <StickyNote className="w-3 h-3 mr-2 text-green-500" /> : <FolderKanban className="w-3 h-3 mr-2 text-blue-500" />}
                                                <span className="truncate">{result.name}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            ) : search.trim().length > 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">No matches found.</div>
                            ) : (
                                <div className="p-4 text-center text-xs text-muted-foreground">Type to search for items to link.</div>
                            )}
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            </div>

            {!hideItems && (
                <div className="flex flex-wrap gap-2">
                    {linksLoading ? (
                        <div className="text-sm text-muted-foreground animate-pulse">Loading links...</div>
                    ) : links && links.length > 0 ? (
                        links.map((link: any) => (
                            <div key={link.id} className="flex items-center bg-accent/50 border border-border/50 rounded-md py-1 pl-2 pr-1 text-sm group">
                                {link.display_type === 'Garden' ? <StickyNote className="w-3 h-3 mr-1.5 text-green-500" /> : <FolderKanban className="w-3 h-3 mr-1.5 text-blue-500" />}
                                <span className="max-w-[150px] truncate mr-2">{link.display_name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeLinkMutation.mutate(link.id)}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-muted-foreground/50 italic">No links yet.</div>
                    )}
                </div>
            )}
        </div>
    );
};
