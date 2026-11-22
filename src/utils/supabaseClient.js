import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gekmjspajxmrygsdjfyl.supabase.co";

const SUPABASE_KEY = "sb_publishable_V_8-7X48xP8Rd_JtkL5aaw_hG4GT0Je";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);