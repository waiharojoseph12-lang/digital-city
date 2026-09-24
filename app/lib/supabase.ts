import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://csdzobbuekubwdekfsow.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZHpvYmJ1ZWt1YndkZWtmc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTMzNTQsImV4cCI6MjEwNTc2OTM1NH0.m4j2m9_s0Aahp93mHUR3-xXscAWZsu6SywkqOYTTJAM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
