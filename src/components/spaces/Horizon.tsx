import { Telescope } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Goals from './horizon/Goals';
import Wishlist from './horizon/Wishlist';

const Horizon = () => {
  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Telescope className="h-10 w-10 text-primary" />
        <div>
          <h2 className="text-4xl font-serif">Horizon</h2>
          <p className="text-foreground/70">
            Set your sights on the future. Plan long-term goals and track your
            wishlist.
          </p>
        </div>
      </div>

      <Tabs defaultValue="goals">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
        </TabsList>
        <TabsContent value="goals" className="mt-6">
          <Goals />
        </TabsContent>
        <TabsContent value="wishlist" className="mt-6">
          <Wishlist />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Horizon;