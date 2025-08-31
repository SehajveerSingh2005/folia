import { Book } from 'lucide-react';

const Journal = () => {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Book className="h-10 w-10 text-primary" />
        <div>
          <h2 className="text-4xl font-serif">Journal</h2>
          <p className="text-foreground/70">
            Reflect daily with guided entries for gratitude, thoughts, and free
            writing.
          </p>
        </div>
      </div>
      {/* Content for Journal will go here */}
    </div>
  );
};

export default Journal;