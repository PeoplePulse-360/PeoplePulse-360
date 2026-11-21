import { createClient } from "@supabase/supabase-js"

// These two values come from the team's Supabase project.
// They are public by design, so it is safe to keep them here.
// NEVER put the Database Password in this file.
const SUPABASE_URL = https://gekmjspajxmrygsdjfyl.supabase.co

const SUPABASE_KEY = sb_publishable_anxV7mfeBmpoOkjRIbtIYA_ha2ePYWI

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
