-- Migration to support avatar_url in the automatic handle_new_user trigger
-- This is crucial for Google OAuth because Google profile images are returned under raw_user_meta_data->>'avatar_url'

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    phone, 
    role, 
    verified, 
    avatar, 
    trust_score, 
    badges, 
    country, 
    region
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'citizen'),
    COALESCE((new.raw_user_meta_data->>'verified')::boolean, false),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url', 
      new.raw_user_meta_data->>'avatar', 
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a1a1aa"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'
    ),
    COALESCE((new.raw_user_meta_data->>'trust_score')::int, 50),
    '{}',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'region'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
