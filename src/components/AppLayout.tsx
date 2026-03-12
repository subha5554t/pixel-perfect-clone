import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Leaf, Tag, FileText, BarChart3, Activity } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/auto-categorize", label: "Auto-Categorize", icon: Tag },
  { to: "/proposal-generator", label: "B2B Proposals", icon: FileText },
  { to: "/impact-reporting", label: "Impact Report", icon: Activity },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-16 gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">Rayeva AI</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
