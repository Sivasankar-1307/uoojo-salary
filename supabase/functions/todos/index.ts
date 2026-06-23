// Supabase Edge Function: Fetch Todos
// Runs on Deno/Edge runtime using @supabase/server SDK

import { withSupabase } from "@supabase/server"

export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    // ctx.supabase is an RLS-scoped client authenticated with the user's JWT
    const { data, error } = await ctx.supabase
      .from("todos")
      .select("*")
      
    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    
    return Response.json(data)
  }),
}
