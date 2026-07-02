import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function Login() {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-chart-5/10 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-md p-8 border border-border bg-card/50 backdrop-blur-xl rounded-xl shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/30">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI SecScore</h1>
        <p className="text-muted-foreground text-center mb-8">
          Enterprise-grade LLM Security Assessment Platform.
          Authenticate to access the command center.
        </p>

        <Button 
          className="w-full h-12 text-base font-semibold tracking-wide shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)]" 
          onClick={login}
          disabled={isLoading}
        >
          {isLoading ? "Connecting..." : "Authenticate via SSO"}
        </Button>
      </div>
    </div>
  );
}
