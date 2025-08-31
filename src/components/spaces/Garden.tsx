import { Sparkles } from 'lucide-react';

const Garden = () => {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Sparkles className="h-10 w-10 text-primary" />
        <div>
          <h2 className="text-4xl font-serif">Garden</h2>
          <p className="text-foreground/70">
            Cultivate raw ideas and quick notes. Watch connections grow between
            them.
          </p>
        </div>
      </div>
      {/* Content for Garden will go here */}
    </div>
  );
};

export default Garden;