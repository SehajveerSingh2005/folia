'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { showError, showSuccess } from '@/utils/toast';
import { Plus, Trophy, Trash2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type Win = {
  id: string;
  title: string;
  note: string | null;
  win_date: string;
  created_at: string;
};

const fetchWins = async (): Promise<Win[]> => {
  const { data, error } = await supabase
    .from('wins')
    .select('*')
    .order('win_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const WIN_EMOJIS = ['🏆', '🎯', '🚀', '⭐', '💪', '🎉', '✨', '🔥', '🌟', '🏅'];
const getEmojiForWin = (id: string) => WIN_EMOJIS[id.charCodeAt(0) % WIN_EMOJIS.length];

const WinsBoard = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newWin, setNewWin] = useState({ title: '', note: '', win_date: format(new Date(), 'yyyy-MM-dd') });

  const { data: wins, isLoading, error } = useQuery<Win[]>({
    queryKey: ['wins'],
    queryFn: fetchWins,
  });

  const addMutation = useMutation({
    mutationFn: async (win: typeof newWin) => {
      const { error } = await supabase.from('wins').insert(win);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess('Win logged! 🎉');
      queryClient.invalidateQueries({ queryKey: ['wins'] });
      setNewWin({ title: '', note: '', win_date: format(new Date(), 'yyyy-MM-dd') });
      setIsAdding(false);
    },
    onError: (err: Error) => showError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wins').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess('Win removed.');
      queryClient.invalidateQueries({ queryKey: ['wins'] });
    },
    onError: (err: Error) => showError(err.message),
  });

  if (error) showError('Could not load wins.');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-amber-500" />
          <div>
            <h3 className="font-serif text-xl">Wins</h3>
            <p className="text-xs text-muted-foreground">{wins?.length ?? 0} achievements logged</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          variant={isAdding ? 'outline' : 'default'}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {isAdding ? 'Cancel' : 'Log a Win'}
        </Button>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <Input
            value={newWin.title}
            onChange={(e) => setNewWin({ ...newWin, title: e.target.value })}
            placeholder="What did you achieve? Be specific."
            className="text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && newWin.title.trim()) {
                addMutation.mutate(newWin);
              }
            }}
          />
          <Textarea
            value={newWin.note}
            onChange={(e) => setNewWin({ ...newWin, note: e.target.value })}
            placeholder="Add a note (optional)…"
            className="text-sm resize-none min-h-[70px]"
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <input
                type="date"
                value={newWin.win_date}
                onChange={(e) => setNewWin({ ...newWin, win_date: e.target.value })}
                className="bg-transparent text-sm text-foreground focus:outline-none"
              />
            </div>
            <Button
              size="sm"
              onClick={() => newWin.title.trim() && addMutation.mutate(newWin)}
              disabled={!newWin.title.trim() || addMutation.isPending}
              className="ml-auto"
            >
              Save Win
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : wins && wins.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border/60" />

          <div className="space-y-4 pl-14">
            {wins.map((win) => {
              const emoji = getEmojiForWin(win.id);
              const isOpen = expanded === win.id;

              return (
                <div key={win.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-8 top-3 w-8 h-8 flex items-center justify-center text-lg bg-background border rounded-full shadow-sm group-hover:scale-110 transition-transform">
                    {emoji}
                  </div>

                  <div
                    className={cn(
                      'rounded-xl border bg-card p-4 cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm',
                      isOpen && 'border-primary/20 bg-primary/5'
                    )}
                    onClick={() => setExpanded(isOpen ? null : win.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm leading-tight">{win.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(win.win_date + 'T12:00:00'), 'MMMM d, yyyy')}
                          <span className="mx-1.5">·</span>
                          {formatDistanceToNow(new Date(win.win_date + 'T12:00:00'), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {win.note && (isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />)}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(win.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {isOpen && win.note && (
                      <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">{win.note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <div className="text-5xl">🏆</div>
          <p className="text-foreground/70 font-medium">No wins logged yet.</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Start tracking your achievements, big and small. Every win counts.
          </p>
        </div>
      )}
    </div>
  );
};

export default WinsBoard;
