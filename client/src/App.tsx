import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import SiteShell from "./components/SiteShell";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import PaperPage from "./pages/Paper";
import SavedPage from "./pages/Saved";
import SourcesPage from "./pages/Sources";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <SiteShell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/paper/:id" component={PaperPage} />
        <Route path="/sources" component={SourcesPage} />
        <Route path="/saved" component={SavedPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </SiteShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
