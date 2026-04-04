
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true);

CREATE POLICY "Authenticated upload chat media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Public view chat media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-media');
