import { Telescope } from 'lucide-react';

const Horizon = () => {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Telescope className="h-10 w-10 text-primary" />
        <div>
          <h2 className="text-4xl font-serif">Horizon</h2>
          <p className="text-foreground/70">
            Set your sights on the future. Plan long-term goals and track your
            wishlist.
          </p>
        </div>
      </div>
      {/* Content for Horizon will go here */}
    </div>
  );
};

export default Horizon;