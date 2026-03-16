import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Sparkles, Loader2, IndianRupee } from "lucide-react";
import { toast } from "sonner";

interface ProposalResult {
  product_mix: Array<{
    product_name: string;
    category: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    sustainability_note?: string;
  }>;
  budget_allocation: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  cost_breakdown: {
    subtotal: number;
    sustainability_premium?: number;
    shipping?: number;
    total: number;
    savings_vs_conventional?: number;
  };
  impact_summary: string;
}

export default function ProposalGeneratorPage() {
  const [clientName, setClientName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProposalResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !budgetLimit) {
      toast.error("Client name and budget are required");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-proposal", {
        body: {
          client_name: clientName,
          client_industry: clientIndustry,
          budget_limit: parseFloat(budgetLimit),
          requirements,
        },
      });

      if (error) throw error;
      setResult(data);

      await supabase.from("b2b_proposals").insert({
        client_name: clientName,
        client_industry: clientIndustry,
        budget_limit: parseFloat(budgetLimit),
        requirements,
        product_mix: data.product_mix,
        budget_allocation: data.budget_allocation,
        cost_breakdown: data.cost_breakdown,
        impact_summary: data.impact_summary,
        raw_json: data,
      });

      toast.success("Proposal generated and saved!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate proposal");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <AppLayout>
      <div className="container py-8 max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-4xl font-display">B2B Proposal Generator</h1>
              <p className="text-muted-foreground text-lg">
                AI-powered sustainable product proposals with budget allocation and impact positioning
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-2 card-elevated animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <FileText className="w-5 h-5 text-primary" />
                Client Details
              </CardTitle>
              <CardDescription>Enter client information to generate a proposal</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Client Name</label>
                  <Input placeholder="e.g., GreenTech Solutions" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Industry</label>
                  <Input placeholder="e.g., Hospitality, Corporate" value={clientIndustry} onChange={(e) => setClientIndustry(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Budget (₹)</label>
                  <Input type="number" placeholder="e.g., 50000" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Requirements</label>
                  <Textarea placeholder="Specific product needs, sustainability goals..." value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={4} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />Generate Proposal</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {result ? (
              <>
                <Card className="card-elevated overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-accent to-warning" />
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display">Suggested Product Mix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Product</th>
                            <th className="text-left py-2 font-medium">Category</th>
                            <th className="text-right py-2 font-medium">Qty</th>
                            <th className="text-right py-2 font-medium">Unit</th>
                            <th className="text-right py-2 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.product_mix.map((p, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2.5">
                                <div>{p.product_name}</div>
                                {p.sustainability_note && (
                                  <div className="text-xs text-success mt-0.5">{p.sustainability_note}</div>
                                )}
                              </td>
                              <td className="py-2.5 text-muted-foreground">{p.category}</td>
                              <td className="py-2.5 text-right">{p.quantity}</td>
                              <td className="py-2.5 text-right">{formatCurrency(p.unit_price)}</td>
                              <td className="py-2.5 text-right font-medium">{formatCurrency(p.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="card-elevated">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-display flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-accent" />
                        Budget Allocation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.budget_allocation.map((b, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{b.category}</span>
                            <span className="font-medium">{b.percentage}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-primary rounded-full transition-all duration-500"
                              style={{ width: `${b.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="card-elevated">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-display">Cost Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(result.cost_breakdown.subtotal)}</span>
                      </div>
                      {result.cost_breakdown.sustainability_premium != null && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sustainability Premium</span>
                          <span>{formatCurrency(result.cost_breakdown.sustainability_premium)}</span>
                        </div>
                      )}
                      {result.cost_breakdown.shipping != null && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{formatCurrency(result.cost_breakdown.shipping)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-semibold text-base">
                        <span>Total</span>
                        <span>{formatCurrency(result.cost_breakdown.total)}</span>
                      </div>
                      {result.cost_breakdown.savings_vs_conventional != null && (
                        <div className="flex justify-between text-success">
                          <span>Savings vs Conventional</span>
                          <span>{formatCurrency(result.cost_breakdown.savings_vs_conventional)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="card-elevated border-primary/20 overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-primary to-info" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-display">Impact Positioning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{result.impact_summary}</p>
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
                <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <FileText className="w-10 h-10 mb-4 opacity-30" />
                  <p className="text-lg font-display">Proposal will appear here</p>
                  <p className="text-sm">Enter client details and generate</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
