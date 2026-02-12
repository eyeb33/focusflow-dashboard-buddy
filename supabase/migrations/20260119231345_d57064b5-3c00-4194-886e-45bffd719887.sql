-- Create curriculum_topics table for storing the Edexcel A-Level Maths curriculum structure
CREATE TABLE public.curriculum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'Pure Mathematics', 'Statistics', 'Mechanics'
  name TEXT NOT NULL,
  subtopics TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create topic_sessions table for tracking user progress per topic
CREATE TABLE public.topic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_id TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  total_time_seconds INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  completed_subtopics TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for faster queries
CREATE INDEX idx_topic_sessions_user_id ON public.topic_sessions(user_id);
CREATE INDEX idx_topic_sessions_user_topic ON public.topic_sessions(user_id, topic_id);
CREATE INDEX idx_curriculum_topics_category ON public.curriculum_topics(category);

-- Enable RLS on both tables
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for curriculum_topics (read-only for all authenticated users)
CREATE POLICY "Anyone can view curriculum topics"
  ON public.curriculum_topics
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS policies for topic_sessions (users can only access their own sessions)
CREATE POLICY "Users can view their own topic sessions"
  ON public.topic_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own topic sessions"
  ON public.topic_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topic sessions"
  ON public.topic_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topic sessions"
  ON public.topic_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for topic_sessions
ALTER TABLE public.topic_sessions REPLICA IDENTITY FULL;

-- Insert the Edexcel A-Level Maths curriculum topics
INSERT INTO public.curriculum_topics (topic_id, category, name, subtopics, sort_order) VALUES
-- Pure Mathematics
('proof', 'Pure Mathematics', 'Proof', ARRAY['Proof by deduction', 'Proof by exhaustion', 'Disproof by counter example'], 1),
('algebra-functions', 'Pure Mathematics', 'Algebra and Functions', ARRAY['Laws of indices', 'Surds', 'Quadratic functions', 'Inequalities', 'Polynomials'], 2),
('coordinate-geometry', 'Pure Mathematics', 'Coordinate Geometry', ARRAY['Straight line graphs', 'Circles', 'Parametric equations'], 3),
('sequences-series', 'Pure Mathematics', 'Sequences and Series', ARRAY['Binomial expansion', 'Arithmetic sequences', 'Geometric sequences'], 4),
('trigonometry', 'Pure Mathematics', 'Trigonometry', ARRAY['Trigonometric identities', 'Solving trig equations', 'Reciprocal functions'], 5),
('exponentials-logarithms', 'Pure Mathematics', 'Exponentials and Logarithms', ARRAY['Laws of logarithms', 'Exponential functions', 'Modelling with exponentials'], 6),
('differentiation', 'Pure Mathematics', 'Differentiation', ARRAY['Product rule', 'Quotient rule', 'Chain rule', 'Implicit differentiation'], 7),
('integration', 'Pure Mathematics', 'Integration', ARRAY['Integration by substitution', 'Integration by parts', 'Differential equations'], 8),
('numerical-methods', 'Pure Mathematics', 'Numerical Methods', ARRAY['Location of roots', 'Newton-Raphson method', 'Trapezium rule'], 9),
('vectors', 'Pure Mathematics', 'Vectors', ARRAY['Vector arithmetic', 'Scalar product', 'Vector equations of lines'], 10),
-- Statistics
('statistical-sampling', 'Statistics', 'Statistical Sampling', ARRAY['Populations and samples', 'Sampling techniques'], 11),
('data-presentation', 'Statistics', 'Data Presentation', ARRAY['Histograms', 'Box plots', 'Cumulative frequency'], 12),
('probability', 'Statistics', 'Probability', ARRAY['Probability distributions', 'Binomial distribution', 'Normal distribution'], 13),
('hypothesis-testing', 'Statistics', 'Hypothesis Testing', ARRAY['Correlation', 'Chi-squared tests'], 14),
-- Mechanics
('kinematics', 'Mechanics', 'Kinematics', ARRAY['SUVAT equations', 'Velocity-time graphs', 'Projectile motion'], 15),
('forces-newtons-laws', 'Mechanics', 'Forces and Newton''s Laws', ARRAY['Force diagrams', 'Resolving forces', 'Connected particles'], 16),
('moments', 'Mechanics', 'Moments', ARRAY['Equilibrium', 'Centre of mass'], 17);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_topic_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_topic_sessions_updated_at
  BEFORE UPDATE ON public.topic_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_topic_sessions_updated_at();