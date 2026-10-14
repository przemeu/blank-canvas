import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProviders, useData } from "@/context/AppContext";
import Layout from "@/components/Layout";
import ResultsPage from "@/pages/ResultsPage";
import MatchPage from "@/pages/MatchPage";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

function Gate({ children }: { children: ReactNode }) {
  const { loading, error } = useData();
  if (loading)
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-arka-navy dark:text-arka-gold" />
        <span className="text-sm">Wczytywanie kroniki meczów…</span>
      </div>
    );
  if (error)
    return (
      <div className="card mx-auto mt-10 max-w-lg p-6 text-center">
        <p className="font-semibold text-red-600">Błąd wczytywania danych</p>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
      </div>
    );
  return <>{children}</>;
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Layout>
          <Gate>
            <Routes>
              <Route path="/" element={<ResultsPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/mecz/:id" element={<MatchPage />} />
              <Route path="/details/:id" element={<MatchPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Gate>
        </Layout>
      </BrowserRouter>
    </AppProviders>
  );
}
