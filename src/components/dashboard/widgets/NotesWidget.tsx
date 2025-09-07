import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/utils/toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tag, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AutoGrowTextarea } from '@/components/ui/auto-grow-textarea';

const categories = ['Writing', 'Project', 'Life', 'Business', 'Random'];

const NotesWidget = () => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleAddNote = async () => {
    if (content.trim() === '') return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError('You must be logged in.');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('garden_items')
      .insert({ 
          content, 
          user_id: user.id, 
          category: category || 'Random',
      });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Note added to Garden.');
      setContent('');
      setCategory('');
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-sans font-medium text-base sm:text-lg">Quick Note</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Plant a new seed in your Garden.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-2">
        <AutoGrowTextarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-grow border-none focus:ring-0 resize-none bg-transparent p-0 text-sm"
        />
        <div className="flex justify-between items-center mt-auto pt-2 border-t">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Tag className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-56" onClick={(e) => e.stopPropagation()}>
              <Command>
                <CommandInput placeholder="Select category..." />
                <CommandList>
                  <CommandEmpty>No categories found.</CommandEmpty>
                  <CommandGroup>
                    {categories.map((cat) => (
                      <CommandItem
                        key={cat}
                        value={cat}
                        onSelect={(currentValue) => {
                          setCategory(currentValue === category ? '' : currentValue);
                          setIsPopoverOpen(false);
                        }}
                      >
                        {cat}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleAddNote} disabled={isSubmitting} variant="ghost" size="icon" className="h-8 w-8">
                <Check className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save Note</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotesWidget;