import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  Sparkles,
  Book,
  Telescope,
  ArrowRight,
  Check,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import HeroVisual from "@/components/HeroVisual";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-serif font-medium">Folia</h1>
          <Button asChild variant="ghost">
            <Link to="/login">Log In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center pt-28 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">
        <div className="text-center max-w-3xl mx-auto px-4 z-10">
          <ScrollFadeIn>
            <h1 className="text-5xl md:text-7xl font-serif font-normal mb-6">
              A home for your thoughts, projects, and days.
            </h1>
          </ScrollFadeIn>
          <ScrollFadeIn delay={200}>
            <p className="text-lg md:text-xl text-foreground/80 mb-10">
              Folia provides the structure, so you can focus on what matters. A
              second brain that's organized from day one.
            </p>
          </ScrollFadeIn>
          <ScrollFadeIn delay={400}>
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              <Link to="/login">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </ScrollFadeIn>
        </div>
        <div className="w-full px-4 mt-16 sm:mt-24">
          <HeroVisual />
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <ScrollFadeIn>
              <h2 className="text-3xl md:text-4xl font-serif mb-4">
                Your thoughts, perfectly organized.
              </h2>
            </ScrollFadeIn>
            <ScrollFadeIn delay={200}>
              <p className="text-lg text-foreground/70 mb-16 md:mb-24">
                We create dedicated spaces for every part of your life, so you can
                focus on what matters.
              </p>
            </ScrollFadeIn>
          </div>
          <div className="space-y-16 md:space-y-24">
            <FeatureShowcase
              icon={<FolderKanban className="h-8 w-8 text-primary" />}
              title="Flow"
              description="Bring your projects to life. Flow is where your active endeavors live, from launching a new website to learning a new skill. Break down big goals into manageable tasks and track your progress from start to finish."
              visual={<FlowVisual />}
            />
            <FeatureShowcase
              icon={<Sparkles className="h-8 w-8 text-primary" />}
              title="Garden"
              description="A space for ideas to grow. Your Garden is a pressure-free zone to plant seeds of thought, quick notes, and random sparks of inspiration. Connect ideas and watch them blossom into full-fledged projects when they're ready."
              visual={<GardenVisual />}
              reverse
            />
            <FeatureShowcase
              icon={<Book className="h-8 w-8 text-primary" />}
              title="Journal"
              description="A private space for daily reflection. Chronicle your days, track your mood, and import completed tasks to see a clear picture of your progress. Your journal is a quiet corner to understand your journey."
              visual={<JournalVisual />}
            />
            <FeatureShowcase
              icon={<Telescope className="h-8 w-8 text-primary" />}
              title="Horizon"
              description="Plan for the future. Horizon is your space for long-term goals, big ideas, and wishlists. Whether it's a book you want to read or a skill you want to master, Horizon keeps your aspirations in sight."
              visual={<HorizonVisual />}
              reverse
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          <ScrollFadeIn>
            <h2 className="text-3xl md:text-4xl font-serif mb-4">
              Effortless setup, instant clarity.
            </h2>
          </ScrollFadeIn>
          <ScrollFadeIn delay={200}>
            <p className="text-lg text-foreground/70 mb-16 max-w-2xl mx-auto">
              Forget the blank page. We personalize your space in three simple
              steps.
            </p>
          </ScrollFadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <ScrollFadeIn delay={300}>
              <StepCard
                number="1"
                title="Answer a few questions"
                description="Tell us how you like to think and work. It's quick, fun, and insightful."
              />
            </ScrollFadeIn>
            <ScrollFadeIn delay={400}>
              <StepCard
                number="2"
                title="We build your space"
                description="Based on your answers, we generate the perfect layouts and spaces for you."
              />
            </ScrollFadeIn>
            <ScrollFadeIn delay={500}>
              <StepCard
                number="3"
                title="Start thinking freely"
                description="Your Folia space is ready. Dive in and capture your first thought without friction."
              />
            </ScrollFadeIn>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        id="cta"
        className="py-16 sm:py-24 bg-primary text-primary-foreground"
      >
        <div className="container mx-auto px-4 text-center">
          <ScrollFadeIn>
            <h2 className="text-4xl md:text-5xl font-serif mb-6">
              Ready to find your focus?
            </h2>
          </ScrollFadeIn>
          <ScrollFadeIn delay={200}>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
              Start building your calm, organized digital home today. It's free to
              get started.
            </p>
          </ScrollFadeIn>
          <ScrollFadeIn delay={400}>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="rounded-full px-8 py-6 text-lg font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              <Link to="/login">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </ScrollFadeIn>
        </div>
      </section>
    </div>
  );
};

const FeatureShowcase = ({
  icon,
  title,
  description,
  visual,
  reverse = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) => (
  <ScrollFadeIn>
    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
      <div className={`md:w-1/2 ${reverse ? 'md:order-last' : ''}`}>
        <div className="mb-4 inline-block">{icon}</div>
        <h3 className="text-2xl md:text-3xl font-sans font-medium mb-4">{title}</h3>
        <p className="text-foreground/70 text-lg">{description}</p>
      </div>
      <div className="md:w-1/2 w-full">
        {visual}
      </div>
    </div>
  </ScrollFadeIn>
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

// --- Stylized Visuals ---

const FlowVisual = () => (
  <div className="bg-background p-6 rounded-lg shadow-lg border border-border">
    <div className="flex justify-between items-center mb-4">
      <h4 className="font-sans font-medium">Website Redesign</h4>
      <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Project</div>
    </div>
    <div className="space-y-3">
      <div className="flex items-center gap-3"><div className="h-5 w-5 rounded bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground"/></div><p className="text-sm text-muted-foreground line-through">Finalize design mockups</p></div>
      <div className="flex items-center gap-3"><div className="h-5 w-5 rounded border-2 border-primary"></div><p className="text-sm">Develop landing page</p></div>
      <div className="flex items-center gap-3"><div className="h-5 w-5 rounded border border-border"></div><p className="text-sm text-muted-foreground">Setup analytics</p></div>
    </div>
  </div>
);

const GardenVisual = () => (
  <div className="relative h-64">
    <div className="absolute top-4 left-8 w-48 bg-background p-4 rounded-lg shadow-lg border border-border transform -rotate-6">
      <p className="text-sm">"What if we used a neural network for idea generation?"</p>
      <div className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground mt-2 inline-block">Project Idea</div>
    </div>
    <div className="absolute bottom-8 right-4 w-56 bg-background p-4 rounded-lg shadow-lg border border-border transform rotate-3">
      <p className="text-sm">"The unexamined life is not worth living." - Socrates</p>
      <div className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground mt-2 inline-block">Writing</div>
    </div>
  </div>
);

const JournalVisual = () => (
  <div className="bg-background p-6 rounded-lg shadow-lg border border-border">
    <div className="flex justify-between items-center mb-4">
      <h4 className="font-sans font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h4>
      <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Good</div>
    </div>
    <p className="text-sm text-muted-foreground italic">"Today was productive. I managed to finish the design mockups and felt a real sense of accomplishment..."</p>
  </div>
);

const HorizonVisual = () => (
  <div className="bg-background p-6 rounded-lg shadow-lg border border-border space-y-3">
    <div className="bg-secondary/50 p-3 rounded-md"><p className="text-sm font-medium">Learn Rust</p></div>
    <div className="bg-secondary/50 p-3 rounded-md ml-4"><p className="text-sm">Read "The Rust Programming Language"</p></div>
    <div className="bg-secondary/50 p-3 rounded-md"><p className="text-sm font-medium">Launch a SaaS product</p></div>
  </div>
);

export default Index;