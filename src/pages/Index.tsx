import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tag, FileText, Activity, Sparkles, ArrowRight, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const [stats, setStats] = useState({ categorizations: 0, proposals: 0, aiCalls: 0, impactReports: 0 });

  useEffect(() => {
    async function loadStats() {
      const [c, p, a, ir] = await Promise.all([
        supabase.from("product_categorizations").select("id", { count: "exact", head: true }),
        supabase.from("b2b_proposals").select("id", { count: "exact", head: true }),
        supabase.from("ai_logs").select("id", { count: "exact", head: true }),
        supabase.from("impact_reports" as any).select("id", { count: "exact", head: true }),
      ]);
      setStats({
        categorizations: c.count ?? 0,
        proposals: p.count ?? 0,
        aiCalls: a.count ?? 0,
        impactReports: (ir as any).count ?? 0,
      });
    }
    loadStats();
  }, []);

  const modules = [
    {
      title: "Auto-Category & Tag Generator",
      description: "AI-powered product categorization with SEO tags and sustainability filters",
      icon: Tag,
      to: "/auto-categorize",
      stat: stats.categorizations,
      statLabel: "products categorized",
      gradient: "from-primary/10 to-success/5",
    },
    {
      title: "B2B Proposal Generator",
      description: "Generate sustainable product proposals with budget allocation and impact positioning",
      icon: FileText,
      to: "/proposal-generator",
      stat: stats.proposals,
      statLabel: "proposals generated",
      gradient: "from-accent/10 to-warning/5",
    },
    {
      title: "Impact Reporting Generator",
      description: "Estimate plastic saved, carbon avoided, and generate impact statements per order",
      icon: Activity,
      to: "/impact-reporting",
      stat: stats.impactReports,
      statLabel: "reports generated",
      gradient: "from-info/10 to-primary/5",
    },
  ];

  return (
    <AppLayout>
      <div className="container py-8 max-w-5xl">
        {/* Hero Section */}
        <div className="gradient-hero rounded-2xl p-8 md:p-12 mb-8 animate-fade-in relative overflow-hidden">
          <div className="gradient-mesh absolute inset-0" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary/20 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-sidebar-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sidebar-foreground/60 text-sm font-medium tracking-wider uppercase">
                  Rayeva AI Systems
                </span>
                <span className="pulse-dot" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-display text-sidebar-foreground mb-3">
              Sustainable Commerce, <br />
              <span className="italic">Powered by AI</span>
            </h1>
            <p className="text-sidebar-foreground/70 text-lg max-w-xl">
              Three production-ready AI modules that automate catalog management, B2B proposals, and environmental impact reporting.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {[
            { label: "Products Categorized", value: stats.categorizations, icon: Tag },
            { label: "Proposals Generated", value: stats.proposals, icon: FileText },
            { label: "Impact Reports", value: stats.impactReports, icon: TrendingUp },
            { label: "AI Calls Made", value: stats.aiCalls, icon: Zap },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="card-elevated stat-card text-center">
                <CardContent className="pt-5 pb-4">
                  <Icon className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-3xl font-display font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Module Cards */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-2xl font-display">Modules</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.to} to={m.to} className="group">
                  <Card className="card-elevated h-full transition-all group-hover:-translate-y-1 overflow-hidden">
                    <div className={`h-1.5 w-full bg-gradient-to-r ${m.gradient}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success">
                          Fully Implemented
                        </span>
                      </div>
                      <CardTitle className="font-display text-lg mt-3">{m.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{m.description}</p>
                      <div className="text-sm font-medium">
                        {m.stat} {m.statLabel}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-primary mt-2 group-hover:gap-2 transition-all">
                        Open module <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
