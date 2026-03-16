import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tag, Sparkles, Loader2, Leaf } from "lucide-react";
import { toast } from "sonner";

interface CategorizationResult {
  primary_category: string;
  sub_category: string;
  seo_tags: string[];
  sustainability_filters: string[];
  reasoning: string;
}

export default function AutoCategorizePage() {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CategorizationResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productDescription) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("auto-categorize", {
        body: { product_name: productName, product_description: productDescription },
      });

      if (error) throw error;
      setResult(data);

      await supabase.from("product_categorizations").insert({
        product_name: productName,
        product_description: productDescription,
        primary_category: data.primary_category,
        sub_category: data.sub_category,
        seo_tags: data.seo_tags,
        sustainability_filters: data.sustainability_filters,
        raw_json: data,
      });

      toast.success("Product categorized and saved!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to categorize product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container py-8 max-w-5xl">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-display">Auto-Category & Tag Generator</h1>
              <p className="text-muted-foreground text-lg">
                AI-powered product categorization with SEO tags and sustainability filters
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="card-elevated animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Tag className="w-5 h-5 text-primary" />
                Product Details
              </CardTitle>
              <CardDescription>Enter your product information for AI categorization</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Product Name</label>
                  <Input
                    placeholder="e.g., Bamboo Toothbrush Set"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Product Description</label>
                  <Textarea
                    placeholder="Describe the product, materials, use case..."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Categorize Product
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {result ? (
              <>
                <Card className="card-elevated overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-primary to-success" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-display">Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="tag-pill text-sm">{result.primary_category}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-sm font-medium">{result.sub_category}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-elevated">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-display">SEO Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.seo_tags.map((tag, i) => (
                        <span key={i} className="tag-pill">{tag}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-elevated">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-success" />
                      Sustainability Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.sustainability_filters.map((filter, i) => (
                        <span key={i} className="tag-sustainability">{filter}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-elevated">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-display">AI Reasoning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.reasoning}</p>
                  </CardContent>
                </Card>

                <Card className="card-elevated">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-display">Structured JSON Output</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="json-output text-xs">{JSON.stringify(result, null, 2)}</pre>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="card-elevated border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Sparkles className="w-10 h-10 mb-4 opacity-30" />
                  <p className="text-lg font-display">Results will appear here</p>
                  <p className="text-sm">Enter product details and click categorize</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
