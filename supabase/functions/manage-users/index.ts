import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "update") {
      const { userId, name, role, accessLevel, squadIds } = body;
      const { error } = await adminClient
        .from("app_users")
        .update({ name, role, access_level: accessLevel, squad_ids: squadIds })
        .eq("id", userId);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { userId } = body;

      // Fetch the app_user to get auth_user_id
      const { data: appUser, error: fetchErr } = await adminClient
        .from("app_users")
        .select("auth_user_id")
        .eq("id", userId)
        .single();
      if (fetchErr) throw fetchErr;

      // Prevent self-deletion
      if (appUser.auth_user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Não é possível excluir a si mesmo" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete app_users row (user_roles will cascade if auth user is deleted)
      const { error: delAppErr } = await adminClient
        .from("app_users")
        .delete()
        .eq("id", userId);
      if (delAppErr) throw delAppErr;

      // Delete user_roles
      if (appUser.auth_user_id) {
        await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", appUser.auth_user_id);

        // Delete auth user
        const { error: authDelErr } = await adminClient.auth.admin.deleteUser(appUser.auth_user_id);
        if (authDelErr) throw authDelErr;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
