import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export type Message = {
  id: string;
  phone_number: string;
  phone_number_id?: string | null;
  direction: "inbound" | "outbound";
  message_text: string;
  sender_type: string | null;
  timestamp: string;
  is_read: boolean | null;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);