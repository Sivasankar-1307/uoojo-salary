// Supabase Edge Function: Manage Orders
// Handles GET and POST requests for the Uoojo Salary system

import { withSupabase } from "@supabase/server"

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const { method } = req
    
    // GET: Retrieve orders for the authenticated user
    if (method === "GET") {
      const { data, error } = await (ctx.supabase as any)
        .from("orders")
        .select("*")
        .order("date", { ascending: false })
        
      if (error) {
        return Response.json({ error: error.message }, { status: 400 })
      }
      return Response.json({ orders: data })
    }
    
    // POST: Create a new order associated with the user
    if (method === "POST") {
      try {
        const body = await req.json()
        const { data, error } = await (ctx.supabase as any)
          .from("orders")
          .insert({
            date: body.date,
            location: body.location,
            salary: body.salary,
            allowance: body.allowance,
            order_type: body.order_type,
            notes: body.notes,
            user_id: ctx.userClaims?.id // Associate with the verified user's ID from JWT claims
          })
          .select()
          
        if (error) {
          return Response.json({ error: error.message }, { status: 400 })
        }
        return Response.json({ success: true, order: data[0] })
      } catch (err) {
        return Response.json({ error: "Invalid request payload or JSON body" }, { status: 400 })
      }
    }
    
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }),
}
