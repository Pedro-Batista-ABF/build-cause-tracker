// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://zinuhecqgqsmlljllsja.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbnVoZWNxZ3FzbWxsamxsc2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMDQxNTYsImV4cCI6MjA2MDY4MDE1Nn0.aSQRO44hQA2Z5TVen6hQVsv7z1nJYUNHkw8npXyoCHg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);