import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  try {
    const { order_description, products } = await req.json();
    if (!order_description || !products || !Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({ error: "order_description and products[] are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Rayeva's sustainability impact analysis AI. You estimate the environmental impact of sustainable product orders compared to conventional alternatives.

Use these reference factors:
- Conventional plastic packaging: ~50g per product unit on average
- Sustainable alternatives save 60-90% of packaging weight
- Carbon emission factors: plastic production ~6kg CO2/kg, bamboo ~0.5kg CO2/kg, recycled materials ~2kg CO2/kg, organic cotton ~3kg CO2/kg vs conventional ~8kg CO2/kg
- Local sourcing (within 200km) reduces transport emissions by ~70%

Be specific and realistic with numbers. Always provide per-product breakdowns.`;

    const productsText = products.map((p: any, i: number) =>
      `${i + 1}. ${p.name} — Quantity: ${p.quantity}, Material: ${p.material || "unspecified"}, Weight: ${p.weight_g || "unknown"}g, Locally sourced: ${p.locally_sourced ? "Yes" : "No"}`
    ).join("\n");

    const userPrompt = `Analyze the environmental impact of this sustainable order:

Order: ${order_description}

Products:
${productsText}

Calculate plastic saved, carbon avoided, local sourcing impact, and generate a human-readable impact statement.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_impact_report",
              description: "Return structured environmental impact analysis for a sustainable product order.",
              parameters: {
                type: "object",
                properties: {
                  plastic_saved_kg: { type: "number", description: "Total plastic saved in kg" },
                  carbon_avoided_kg: { type: "number", description: "Total carbon emissions avoided in kg" },
                  local_sourcing_percentage: { type: "number", description: "Percentage of products sourced locally" },
                  local_artisans_supported: { type: "integer", description: "Estimated number of local artisans/suppliers" },
                  impact_statement: { type: "string", description: "2-3 sentence human-readable impact summary" },
                  breakdown: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        product: { type: "string" },
                        plastic_saved_g: { type: "number" },
                        carbon_avoided_g: { type: "number" },
                        locally_sourced: { type: "boolean" },
                        sustainability_score: { type: "number", description: "Score 1-10" },
                        note: { type: "string", description: "Brief sustainability note" },
                      },
                      required: ["product", "plastic_saved_g", "carbon_avoided_g", "locally_sourced"],
                    },
                  },
                },
                required: ["plastic_saved_kg", "carbon_avoided_kg", "local_sourcing_percentage", "local_artisans_supported", "impact_statement", "breakdown"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_impact_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);
    const latencyMs = Date.now() - startTime;

    // Log to ai_logs
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/ai_logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          module: "generate-impact-report",
          prompt: userPrompt,
          response: JSON.stringify(result),
          model: "google/gemini-3-flash-preview",
          latency_ms: latencyMs,
        }),
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-impact-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
