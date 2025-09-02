import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/utils/toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Tag } from 'lucide-react';

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
        <CardTitle className="font-sans font-medium">Quick Note</CardTitle>
        <CardDescription>
          Plant a new seed in your Garden.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-2">
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-grow"
        />
        <div className="flex justify-between items-center mt-auto pt-2">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Tag className="mr-2 h-4 w-4" />
                {category || 'Category'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-56">
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
          <Button onClick={handleAddNote} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotesWidget;