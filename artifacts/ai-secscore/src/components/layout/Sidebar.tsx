import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useTranslation } from "react-i18next";
import {
  Shield,
  LayoutDashboard,
  ClipboardList,
  GitCompare,
  LineChart,
  FileText,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "pt-BR", label: "PT" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const NAV_ITEMS = [
    { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/assessments", label: t("nav.assessments"), icon: ClipboardList },
    { href: "/assessments/compare", label: t("nav.compare"), icon: GitCompare },
    { href: "/history", label: t("nav.history"), icon: LineChart },
    { href: "/reports", label: t("nav.reports"), icon: FileText },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
        <Shield className="w-6 h-6 text-primary mr-3 shrink-0" />
        <span className="font-bold tracking-tight text-sidebar-foreground">AI SecScore</span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="ml-auto p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <div
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4 mr-3 shrink-0", isActive ? "text-primary" : "")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-colors",
                  i18n.language === lang.code || (i18n.language.startsWith(lang.code.split("-")[0] + "-") && lang.code.includes("-"))
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center truncate">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-border shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                <span className="text-xs font-bold text-muted-foreground">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </span>
              </div>
            )}
            <div className="ml-3 truncate">
              <p className="text-sm font-medium truncate">
                {user?.firstName || user?.email || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-sidebar-accent transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  return (
    <div className="md:hidden h-14 px-4 flex items-center justify-between border-b border-border bg-sidebar shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold tracking-tight text-sidebar-foreground">AI SecScore</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={cn(
                "px-1.5 py-0.5 rounded text-xs font-medium transition-colors",
                i18n.language === lang.code || (i18n.language.startsWith(lang.code.split("-")[0] + "-") && lang.code.includes("-"))
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header bar */}
      <MobileHeader onMenuOpen={() => setMobileOpen(true)} />

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r border-sidebar-border" aria-describedby={undefined} hideClose>
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 border-r border-border bg-sidebar flex-col h-screen overflow-hidden shrink-0">
        <SidebarContent />
      </div>
    </>
  );
}
