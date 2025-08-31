import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  first_name: z.string().min(2, 'First name is required.'),
  last_name: z.string().min(2, 'Last name is required.'),
  primary_goal: z.string({ required_error: 'Please select an option.' }),
  organization_style: z.string({
    required_error: 'Please select an option.',
  }),
});

const Onboarding = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  const totalSteps = 3;

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        navigate('/login');
      }
      setLoading(false);
    };
    fetchUser();
  }, [navigate]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
    },
  });

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError('You must be logged in to continue.');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: values.first_name,
        last_name: values.last_name,
        primary_goal: values.primary_goal,
        organization_style: values.organization_style,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Welcome to Folia!');
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        <Progress value={(step / totalSteps) * 100} className="mb-4" />
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {step === 1 && (
                <>
                  <CardHeader>
                    <CardTitle className="font-serif text-3xl font-normal">
                      Welcome to Folia
                    </CardTitle>
                    <CardDescription>
                      Let's start with the basics. What should we call you?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="button"
                      onClick={async () => {
                        const isValid = await form.trigger([
                          'first_name',
                          'last_name',
                        ]);
                        if (isValid) nextStep();
                      }}
                      className="ml-auto"
                    >
                      Next
                    </Button>
                  </CardFooter>
                </>
              )}

              {step === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="font-serif text-3xl font-normal">
                      What brings you here?
                    </CardTitle>
                    <CardDescription>
                      This will help us personalize your starting spaces.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="primary_goal"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="projects" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Organize my projects and tasks
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="ideas" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Capture and connect my ideas
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="journal" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Journal, reflect, and track habits
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="goals" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Plan my long-term goals
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={prevStep}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button
                      type="button"
                      onClick={async () => {
                        const isValid = await form.trigger('primary_goal');
                        if (isValid) nextStep();
                      }}
                    >
                      Next
                    </Button>
                  </CardFooter>
                </>
              )}

              {step === 3 && (
                <>
                  <CardHeader>
                    <CardTitle className="font-serif text-3xl font-normal">
                      How do you think?
                    </CardTitle>
                    <CardDescription>
                      Everyone's brain is different. What's your style?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="organization_style"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="structured" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Structured: I like lists, tables, and clear
                                  hierarchies.
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="visual" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Visual: I prefer mind maps and connecting
                                  ideas freely.
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="fluid" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Fluid: I just want to write and organize it
                                  later.
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={prevStep}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting
                        ? 'Building your space...'
                        : 'Finish Setup'}
                    </Button>
                  </CardFooter>
                </>
              )}
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;