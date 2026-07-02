import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { 
  Shield, 
  LayoutDashboard, 
  ClipboardList, 
  GitCompare, 
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assessments", label: "Assessments", icon: ClipboardList },
  { href: "/assessments/compare", label: "Compare", icon: GitCompare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-screen overflow-hidden">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
        <Shield className="w-6 h-6 text-primary mr-3" />
        <span className="font-bold tracking-tight text-sidebar-foreground">AI SecScore</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || 
                           (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4 mr-3", isActive ? "text-primary" : "")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center truncate">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-border shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                <span className="text-xs font-bold text-muted-foreground">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </span>
              </div>
            )}
            <div className="ml-3 truncate">
              <p className="text-sm font-medium truncate">{user?.firstName || user?.email || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-sidebar-accent transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
