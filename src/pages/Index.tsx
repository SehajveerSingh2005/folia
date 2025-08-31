import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4 py-16">
          <h1 className="text-5xl md:text-7xl font-serif font-normal mb-6">
            A home for your thoughts, projects, and days.
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-10">
            No setup. No stress. Just a second brain that grows with you.
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-medium shadow-sm hover:shadow-md transition-shadow"
          >
            Get Started Free
          </Button>
        </div>
      </main>
      <div className="w-full">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;