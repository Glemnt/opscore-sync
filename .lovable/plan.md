

## Bug: Edge function `create-user` fails with "supabaseKey is required"

### Root Cause
Line 27 of `supabase/functions/create-user/index.ts` uses `Deno.env.get("SUPABASE_PUBLISHABLE_KEY")` which does not exist in the edge function environment. The correct env var is `SUPABASE_ANON_KEY`.

### Fix
**File:** `supabase/functions/create-user/index.ts`
- Change line 27: replace `SUPABASE_PUBLISHABLE_KEY` with `SUPABASE_ANON_KEY`

Single line change, then redeploy and retest.

