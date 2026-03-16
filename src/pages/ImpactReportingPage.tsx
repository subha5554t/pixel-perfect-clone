import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Sparkles, Loader2, Leaf, Globe, Trash2, Plus, TreePine, Users, Recycle } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface ProductInput {
  name: string;
  quantity: number;
  material: string;
  weight_g: number;
  locally_sourced: boolean;
}

interface BreakdownItem {
  product: string;
  plastic_saved_g: number;
  carbon_avoided_g: number;
  locally_sourced: boolean;
  sustainability_score?: number;
  note?: string;
}

interface ImpactResult {
  plastic_saved_kg: number;
  carbon_avoided_kg: number;
  local_sourcing_percentage: number;
  local_artisans_supported: number;
  impact_statement: string;
  breakdown: BreakdownItem[];
}

const emptyProduct = (): ProductInput => ({
  name: "",
  quantity: 1,
  material: "",
  weight_g: 0,
  locally_sourced: false,
});

export default function ImpactReportingPage() {
  const [orderDescription, setOrderDescription] = useState("");
  const [products, setProducts] = useState<ProductInput[]>([emptyProduct()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImpactResult | null>(null);

  const addProduct = () => setProducts((p) => [...p, emptyProduct()]);
  const removeProduct = (i: number) => setProducts((p) => p.filter((_, idx) => idx !== i));
  const updateProduct = (i: number, field: keyof ProductInput, value: any) => {
    setProducts((p) => p.map((prod, idx) => (idx === i ? { ...prod, [field]: value } : prod)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validProducts = products.filter((p) => p.name.trim());
    if (!orderDescription || validProducts.length === 0) {
      toast.error("Please provide order description and at least one product");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-impact-report", {
        body: { order_description: orderDescription, products: validProducts },
      });

      if (error) throw error;
      setResult(data);

      // Save to database
      await supabase.from("impact_reports" as any).insert({
        order_description: orderDescription,
        products: validProducts,
        plastic_saved_kg: data.plastic_saved_kg,
        carbon_avoided_kg: data.carbon_avoided_kg,
        local_sourcing_percentage: data.local_sourcing_percentage,
        local_artisans_supported: data.local_artisans_supported,
        impact_statement: data.impact_statement,
        breakdown: data.breakdown,
        raw_json: data,
      } as any);

      toast.success("Impact report generated and saved!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate impact report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container py-8 max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-success" />
            </div>
            <div>
              <h1 className="text-4xl font-display">Impact Reporting Generator</h1>
              <p className="text-muted-foreground text-lg">
                AI-powered environmental impact analysis — estimate plastic saved, carbon avoided & local sourcing impact
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <Card className="lg:col-span-2 card-elevated animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Leaf className="w-5 h-5 text-success" />
                Order Details
              </CardTitle>
              <CardDescription>Add products to estimate environmental impact</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Order Description</label>
                  <Textarea
                    placeholder="e.g., Monthly sustainable supplies for EcoHotel chain — 50 rooms"
                    value={orderDescription}
                    onChange={(e) => setOrderDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Products</label>
                    <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>

                  {products.map((product, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border space-y-3 relative group">
                      {products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(i)}
                          className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <Input
                        placeholder="Product name"
                        value={product.name}
                        onChange={(e) => updateProduct(i, "name", e.target.value)}
                        className="bg-background"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Material</label>
                          <Input
                            placeholder="e.g., Bamboo"
                            value={product.material}
                            onChange={(e) => updateProduct(i, "material", e.target.value)}
                            className="bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Weight (g)</label>
                          <Input
                            type="number"
                            placeholder="200"
                            value={product.weight_g || ""}
                            onChange={(e) => updateProduct(i, "weight_g", parseInt(e.target.value) || 0)}
                            className="bg-background"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Quantity</label>
                          <Input
                            type="number"
                            min={1}
                            value={product.quantity}
                            onChange={(e) => updateProduct(i, "quantity", parseInt(e.target.value) || 1)}
                            className="bg-background"
                          />
                        </div>
                        <div className="flex items-end gap-2 pb-1">
                          <Switch
                            checked={product.locally_sourced}
                            onCheckedChange={(v) => updateProduct(i, "locally_sourced", v)}
                          />
                          <label className="text-xs text-muted-foreground">Locally sourced</label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing Impact...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Impact Report
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {result ? (
              <>
                {/* Hero metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Plastic Saved", value: `${result.plastic_saved_kg} kg`, icon: Recycle, color: "text-success" },
                    { label: "Carbon Avoided", value: `${result.carbon_avoided_kg} kg`, icon: TreePine, color: "text-info" },
                    { label: "Local Sourcing", value: `${result.local_sourcing_percentage}%`, icon: Globe, color: "text-accent" },
                    { label: "Artisans Supported", value: result.local_artisans_supported, icon: Users, color: "text-primary" },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <Card key={m.label} className="card-elevated text-center">
                        <CardContent className="pt-5 pb-4">
                          <Icon className={`w-5 h-5 mx-auto mb-2 ${m.color}`} />
                          <div className="text-2xl font-display font-bold">{m.value}</div>
                          <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Impact statement */}
                <Card className="card-elevated border-success/20 overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-success to-info" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-success" />
                      Impact Statement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{result.impact_statement}</p>
                  </CardContent>
                </Card>

                {/* Per-product breakdown */}
                <Card className="card-elevated">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display">Per-Product Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Product</th>
                            <th className="text-right py-2 font-medium">Plastic Saved</th>
                            <th className="text-right py-2 font-medium">Carbon Avoided</th>
                            <th className="text-center py-2 font-medium">Local</th>
                            <th className="text-center py-2 font-medium">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.breakdown.map((item, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2.5">
                                <div className="font-medium">{item.product}</div>
                                {item.note && <div className="text-xs text-muted-foreground mt-0.5">{item.note}</div>}
                              </td>
                              <td className="py-2.5 text-right text-success font-medium">{item.plastic_saved_g}g</td>
                              <td className="py-2.5 text-right text-info font-medium">{item.carbon_avoided_g}g</td>
                              <td className="py-2.5 text-center">{item.locally_sourced ? "✓" : "—"}</td>
                              <td className="py-2.5 text-center">
                                {item.sustainability_score && (
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                    item.sustainability_score >= 8 ? "bg-success/10 text-success" :
                                    item.sustainability_score >= 5 ? "bg-warning/10 text-warning" :
                                    "bg-destructive/10 text-destructive"
                                  }`}>
                                    {item.sustainability_score}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* JSON */}
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
                <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Activity className="w-10 h-10 mb-4 opacity-30" />
                  <p className="text-lg font-display">Impact report will appear here</p>
                  <p className="text-sm">Add products and generate to see environmental impact</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
