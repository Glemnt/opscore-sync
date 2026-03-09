import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { clientPlatformId } = await req.json();
    if (!clientPlatformId) throw new Error("clientPlatformId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(supabaseUrl, serviceKey);

    // Fetch platform data
    const [platformRes, notesRes, logsRes, tasksRes] = await Promise.all([
      sb.from("client_platforms").select("*").eq("id", clientPlatformId).single(),
      sb.from("platform_chat_notes").select("*").eq("client_platform_id", clientPlatformId).order("created_at", { ascending: false }).limit(20),
      sb.from("platform_change_logs").select("*").eq("client_platform_id", clientPlatformId).order("changed_at", { ascending: false }).limit(20),
      sb.from("tasks").select("id, title, status, priority, deadline, responsible, created_at"),
    ]);

    if (platformRes.error) throw platformRes.error;
    const platform = platformRes.data;

    // Get client info
    const { data: client } = await sb.from("clients").select("name, company_name").eq("id", platform.client_id).single();

    // Filter tasks for this platform
    const platformTasks = (tasksRes.data ?? []).filter((t: any) =>
      t.client_id === platform.client_id || (Array.isArray(t.platform) && t.platform.includes(platform.platform_slug))
    );

    const notes = (notesRes.data ?? []).map((n: any) => `[${n.author}] ${n.message}`).join("\n");
    const logs = (logsRes.data ?? []).map((l: any) => `${l.field}: ${l.old_value} → ${l.new_value}`).join("\n");
    const pendingTasks = platformTasks.filter((t: any) => t.status !== "done").length;
    const totalTasks = platformTasks.length;

    const prompt = `Você é um analista de operações de e-commerce. Analise os dados abaixo de uma plataforma de marketplace e gere uma análise operacional.

Cliente: ${client?.name ?? "Desconhecido"} (${client?.company_name ?? ""})
Plataforma: ${platform.platform_slug}
Fase atual: ${platform.phase}
Saúde: ${platform.health_color ?? "não definida"}
Qualidade: ${platform.quality_level ?? "não definida"}
Responsável: ${platform.responsible || "não definido"}
Data início: ${platform.start_date ?? "não definida"}

Tarefas: ${totalTasks} total, ${pendingTasks} pendentes
Notas recentes:
${notes || "(nenhuma)"}

Log de alterações recentes:
${logs || "(nenhum)"}

Gere a análise usando a função fornecida.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um analista de operações de e-commerce brasileiro. Responda sempre em português." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "platform_analysis",
            description: "Retorna a análise operacional da plataforma",
            parameters: {
              type: "object",
              properties: {
                satisfactionScore: { type: "number", description: "Score de 0 a 10" },
                sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                operationalSummary: { type: "string", description: "Resumo operacional em 2-3 frases" },
                weeklyNextSteps: { type: "array", items: { type: "string" }, description: "3-5 próximos passos" },
                avgResponseTime: { type: "string", description: "Estimativa de tempo de resposta" },
              },
              required: ["satisfactionScore", "sentiment", "operationalSummary", "weeklyNextSteps", "avgResponseTime"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "platform_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("platform-ai-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
