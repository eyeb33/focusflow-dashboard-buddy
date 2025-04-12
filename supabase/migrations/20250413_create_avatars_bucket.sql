
-- Create a storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Allow public access to read from the avatars bucket 
CREATE POLICY "Public access to avatars" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload to avatars bucket
CREATE POLICY "Users can upload avatars" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatars" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatars" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'avatars' AND auth.uid() = owner);
