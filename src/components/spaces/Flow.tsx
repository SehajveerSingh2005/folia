import { FolderKanban } from 'lucide-react';

const Flow = () => {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <FolderKanban className="h-10 w-10 text-primary" />
        <div>
          <h2 className="text-4xl font-serif">Flow</h2>
          <p className="text-foreground/70">
            Manage active projects, courses, and tasks. See your progress at a
            glance.
          </p>
        </div>
      </div>
      {/* Content for Flow will go here */}
    </div>
  );
};

export default Flow;