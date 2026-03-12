import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PREDEFINED_CATEGORIES = [
  "Kitchen & Dining",
  "Personal Care",
  "Home & Living",
  "Fashion & Accessories",
  "Office & Stationery",
  "Baby & Kids",
  "Food & Beverages",
  "Garden & Outdoor",
  "Cleaning & Laundry",
  "Pet Supplies",
  "Health & Wellness",
  "Travel & Lifestyle"
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  try {
    const { product_name, product_description } = await req.json();
    if (!product_name || !product_description) {
      return new Response(JSON.stringify({ error: "product_name and product_description are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a sustainable commerce product categorization AI for Rayeva. Your job is to analyze product details and return structured categorization data.

Available primary categories: ${PREDEFINED_CATEGORIES.join(", ")}

You MUST use the suggest_categorization tool to return your response.`;

    const userPrompt = `Analyze this product and categorize it:

Product Name: ${product_name}
Product Description: ${product_description}

Provide:
1. Primary category (from the predefined list)
2. Sub-category (specific within the primary)
3. 5-10 SEO tags
4. Sustainability filters (from: plastic-free, compostable, vegan, recycled, biodegradable, organic, fair-trade, zero-waste, carbon-neutral, locally-sourced, cruelty-free, reusable)`;

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
              name: "suggest_categorization",
              description: "Return structured product categorization with category, tags, and sustainability filters.",
              parameters: {
                type: "object",
                properties: {
                  primary_category: { type: "string", description: "Primary category from predefined list" },
                  sub_category: { type: "string", description: "Specific sub-category" },
                  seo_tags: { type: "array", items: { type: "string" }, description: "5-10 SEO tags" },
                  sustainability_filters: { type: "array", items: { type: "string" }, description: "Applicable sustainability filters" },
                  reasoning: { type: "string", description: "Brief explanation of categorization choices" },
                },
                required: ["primary_category", "sub_category", "seo_tags", "sustainability_filters", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_categorization" } },
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

    // Log to ai_logs via Supabase
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
          module: "auto-categorize",
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
    console.error("auto-categorize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
