-- Remove old US institutions
DELETE FROM public.institutions 
WHERE name IN (
  'MIT - Massachusetts Institute of Technology',
  'Stanford University',
  'Georgia Tech',
  'Carnegie Mellon University',
  'UC Berkeley'
);

-- Insert new Bangalore institutions
INSERT INTO public.institutions (name, location) VALUES
  ('REVA University', 'Bangalore, KA'),
  ('PES University', 'Bangalore, KA'),
  ('Bangalore Institute of Technology', 'Bangalore, KA'),
  ('Christ University', 'Bangalore, KA'),
  ('VIT Bangalore', 'Bangalore, KA');
