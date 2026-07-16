import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";

// Pages (lazy-loaded for code-splitting)
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Assessments = lazy(() => import("@/pages/Assessments"));
const AssessmentDetail = lazy(() => import("@/pages/AssessmentDetail"));
const ResultsDashboard = lazy(() => import("@/pages/ResultsDashboard"));
const CorporateResults = lazy(() => import("@/pages/CorporateResults"));
const Compliance = lazy(() => import("@/pages/Compliance"));
const CompareAssessments = lazy(() => import("@/pages/CompareAssessments"));
const History = lazy(() => import("@/pages/History"));
const Settings = lazy(() => import("@/pages/Settings"));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/assessments" component={Assessments} />
          <Route path="/assessments/compare" component={CompareAssessments} />
          <Route path="/assessments/:id" component={AssessmentDetail} />
          <Route path="/assessments/:id/results" component={ResultsDashboard} />
          <Route path="/assessments/:id/corporate-results" component={CorporateResults} />
          <Route path="/assessments/:id/compliance" component={Compliance} />
          <Route path="/history" component={History} />
          <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
