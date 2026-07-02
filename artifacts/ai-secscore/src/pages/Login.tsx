import { useAuth } from "@workspace/replit-auth-web";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Shield, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "pt-BR", label: "PT" },
];

export default function Login() {
  const { login, isLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-chart-5/10 rounded-full blur-[120px]" />
      </div>

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-card/60 backdrop-blur border border-border rounded-lg px-2 py-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-colors",
                i18n.language === lang.code ||
                  (lang.code === "pt-BR" && i18n.language.startsWith("pt"))
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-card/60 backdrop-blur border border-border text-muted-foreground hover:text-foreground transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="z-10 w-full max-w-md p-8 border border-border bg-card/50 backdrop-blur-xl rounded-xl shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/30">
          <Shield className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("login.title")}</h1>
        <p className="text-muted-foreground text-center mb-8">
          {t("login.subtitle")}
        </p>

        <Button
          className="w-full h-12 text-base font-semibold tracking-wide shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)]"
          onClick={login}
          disabled={isLoading}
        >
          {isLoading ? t("common.loading") : t("login.loginButton")}
        </Button>
      </div>
    </div>
  );
}
