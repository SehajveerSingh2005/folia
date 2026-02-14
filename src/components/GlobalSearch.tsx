import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  File,
  Sparkles,
  Telescope,
  FolderKanban,
  Book,
  ClipboardList,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { View } from './layout/Sidebar';
import { useNavigate } from '@/lib/navigation';

type SearchResult = {
  id: string;
  title: string;
  type: View;
  path: string;
};

interface GlobalSearchProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const GlobalSearch = ({
  isOpen,
  onOpenChange,
}: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm) {
        setResults([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.rpc('global_search', {
        search_term: debouncedSearchTerm,
      });

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        setResults(data || []);
      }
      setLoading(false);
    };

    if (isOpen) {
      performSearch();
    }
  }, [debouncedSearchTerm, isOpen]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    onOpenChange(false);
    setSearchTerm('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Flow':
        return <FolderKanban className="mr-2 h-4 w-4" />;
      case 'Garden':
        return <Sparkles className="mr-2 h-4 w-4" />;
      case 'Horizon':
        return <Telescope className="mr-2 h-4 w-4" />;
      case 'Loom':
        return <ClipboardList className="mr-2 h-4 w-4" />;
      case 'Journal':
        return <Book className="mr-2 h-4 w-4" />;
      default:
        return <File className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search across your entire space..."
        value={searchTerm}
        onValueChange={setSearchTerm}
      />
      <CommandList>
        {loading && <CommandEmpty>Searching...</CommandEmpty>}
        {!loading && !results.length && debouncedSearchTerm && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {!loading && !results.length && !debouncedSearchTerm && (
          <CommandEmpty>Type to start searching.</CommandEmpty>
        )}

        <CommandGroup heading="Results">
          {results.map((result) => (
            <CommandItem
              key={`${result.id}-${result.type}`}
              onSelect={() => handleSelect(result)}
              value={`${result.title}-${result.type}`}
            >
              {getIcon(result.type)}
              <span className="truncate">{result.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {result.type}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;