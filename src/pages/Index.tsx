import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import {
  FolderKanban,
  Sparkles,
  Book,
  Telescope,
  ArrowRight,
} from "lucide-react";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-serif font-medium">Folia</h1>
          <Button variant="ghost">Log In</Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center pt-24 sm:pt-32">
        <div className="text-center max-w-2xl mx-auto px-4 py-16">
          <h1 className="text-5xl md:text-7xl font-serif font-normal mb-6">
            A home for your thoughts, projects, and days.
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-10">
            No setup. No stress. Folia is a second brain that grows with you.
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-medium shadow-sm hover:shadow-md transition-shadow"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif mb-4">
              Your thoughts, perfectly organized.
            </h2>
            <p className="text-lg text-foreground/70 mb-12">
              We create dedicated spaces for every part of your life, so you can
              focus on what matters.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<FolderKanban className="h-8 w-8 text-primary" />}
              title="Flow"
              description="Manage active projects, courses, and tasks. See your progress at a glance."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-primary" />}
              title="Garden"
              description="Cultivate raw ideas and quick notes. Watch connections grow between them."
            />
            <FeatureCard
              icon={<Book className="h-8 w-8 text-primary" />}
              title="Journal"
              description="Reflect daily with guided entries for gratitude, thoughts, and free writing."
            />
            <FeatureCard
              icon={<Telescope className="h-8 w-8 text-primary" />}
              title="Horizon"
              description="Set your sights on the future. Plan long-term goals and track your wishlist."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">
            Effortless setup, instant clarity.
          </h2>
          <p className="text-lg text-foreground/70 mb-16 max-w-2xl mx-auto">
            Forget the blank page. We personalize your space in three simple
            steps.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <StepCard
              number="1"
              title="Answer a few questions"
              description="Tell us how you like to think and work. It's quick, fun, and insightful."
            />
            <StepCard
              number="2"
              title="We build your space"
              description="Based on your answers, we generate the perfect layouts and spaces for you."
            />
            <StepCard
              number="3"
              title="Start thinking freely"
              description="Your Folia space is ready. Dive in and capture your first thought without friction."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        id="cta"
        className="py-16 sm:py-24 bg-primary text-primary-foreground"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">
            Ready to find your focus?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Start building your calm, organized digital home today. It's free to
            get started.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full px-8 py-6 text-lg font-medium shadow-sm hover:shadow-md transition-shadow"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <div className="w-full">
        <MadeWithDyad />
      </div>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="bg-background p-6 rounded-lg shadow-sm text-left">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-sans font-medium mb-2">{title}</h3>
    <p className="text-foreground/70">{description}</p>
  </div>
);

const StepCard = ({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) => (
  <div className="text-left md:text-center">
    <div className="flex items-center md:justify-center mb-4">
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-secondary text-primary font-bold text-xl">
        {number}
      </div>
    </div>
    <h3 className="text-xl font-sans font-medium mb-2">{title}</h3>
    <p className="text-foreground/70">{description}</p>
  </div>
);

export default Index;