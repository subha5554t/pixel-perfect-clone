import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  try {
    const { client_name, client_industry, budget_limit, requirements } = await req.json();
    if (!client_name || !budget_limit) {
      return new Response(JSON.stringify({ error: "client_name and budget_limit are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a B2B sustainable commerce proposal generator for Rayeva. Generate professional proposals for corporate clients looking to source sustainable products. Always suggest eco-friendly alternatives and provide clear cost breakdowns.`;

    const userPrompt = `Generate a B2B sustainable product proposal:

Client: ${client_name}
Industry: ${client_industry || "General"}
Budget: ₹${budget_limit}
Requirements: ${requirements || "General sustainable product sourcing"}

Provide:
1. Suggested sustainable product mix (3-6 products with quantities and unit prices)
2. Budget allocation across product categories
3. Detailed cost breakdown with totals
4. Impact positioning summary (how this order contributes to sustainability)`;

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
              name: "generate_proposal",
              description: "Return a structured B2B proposal with product mix, budget allocation, cost breakdown, and impact summary.",
              parameters: {
                type: "object",
                properties: {
                  product_mix: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        product_name: { type: "string" },
                        category: { type: "string" },
                        quantity: { type: "number" },
                        unit_price: { type: "number" },
                        total_price: { type: "number" },
                        sustainability_note: { type: "string" },
                      },
                      required: ["product_name", "category", "quantity", "unit_price", "total_price"],
                    },
                  },
                  budget_allocation: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        amount: { type: "number" },
                        percentage: { type: "number" },
                      },
                      required: ["category", "amount", "percentage"],
                    },
                  },
                  cost_breakdown: {
                    type: "object",
                    properties: {
                      subtotal: { type: "number" },
                      sustainability_premium: { type: "number" },
                      shipping: { type: "number" },
                      total: { type: "number" },
                      savings_vs_conventional: { type: "number" },
                    },
                    required: ["subtotal", "total"],
                  },
                  impact_summary: { type: "string", description: "2-3 sentence impact positioning summary" },
                },
                required: ["product_mix", "budget_allocation", "cost_breakdown", "impact_summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_proposal" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
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
          module: "generate-proposal",
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
    console.error("generate-proposal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
