import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://axiwvbobxwuorciukemg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aXd2Ym9ieHd1b3JjaXVrZW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTc1OTAsImV4cCI6MjA4OTMzMzU5MH0.vI8DL702kk3mWzEq76TdBslxNy8bxKQQeGpBTA_6too";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
