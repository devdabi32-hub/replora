import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xloppafivbvsljfxtjwh.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZteRAtqnraxCKTi5KBpkQw_FiwBtKfd";

export type Message = {
  id: string;
  phone_number: string;
  direction: "inbound" | "outbound";
  message_text: string;
  sender_type: string | null;
  timestamp: string;
  is_read: boolean | null;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);