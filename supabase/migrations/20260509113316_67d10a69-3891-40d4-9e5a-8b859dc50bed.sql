-- Hardening documents bucket policies
ALTER POLICY "Users read own docs" ON storage.objects TO authenticated;
ALTER POLICY "Users upload own docs" ON storage.objects TO authenticated;
ALTER POLICY "Users delete own docs" ON storage.objects TO authenticated;
ALTER POLICY "deal_rooms_owner_read_docs" ON storage.objects TO authenticated;
ALTER POLICY "deal_rooms_owner_write_docs" ON storage.objects TO authenticated;
ALTER POLICY "deal_rooms_owner_delete_docs" ON storage.objects TO authenticated;