-- Wins/Brag Board table
CREATE TABLE IF NOT EXISTS public.wins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  note text,
  win_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Row Level Security
ALTER TABLE public.wins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wins"
  ON public.wins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wins"
  ON public.wins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wins"
  ON public.wins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wins"
  ON public.wins FOR DELETE
  USING (auth.uid() = user_id);
