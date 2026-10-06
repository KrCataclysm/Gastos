import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { AppShell } from "./components/AppShell";
import { ToastProvider } from "./components/Toast";
import { Loading } from "./components/ui";
import { Login } from "./pages/Login";
import { ThemeProvider } from "./theme/ThemeProvider";

const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Transactions = lazy(() => import("./pages/Transactions").then((m) => ({ default: m.Transactions })));
const Analysis = lazy(() => import("./pages/Analysis").then((m) => ({ default: m.Analysis })));
const Budget = lazy(() => import("./pages/Budget").then((m) => ({ default: m.Budget })));
const Goals = lazy(() => import("./pages/Goals").then((m) => ({ default: m.Goals })));
const Recurring = lazy(() => import("./pages/Recurring").then((m) => ({ default: m.Recurring })));
const Manage = lazy(() => import("./pages/Manage").then((m) => ({ default: m.Manage })));
const Profile = lazy(() => import("./pages/Profile").then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const More = lazy(() => import("./pages/More").then((m) => ({ default: m.More })));

export function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter basename="/Gastos">
          <Suspense fallback={<div className="content"><Loading /></div>}>
            <Routes>
              <Route path="/entrar" element={<Login />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  <Route path="lancamentos" element={<Transactions />} />
                  <Route path="analises" element={<Analysis />} />
                  <Route path="orcamento" element={<Budget />} />
                  <Route path="metas" element={<Goals />} />
                  <Route path="fixas" element={<Recurring />} />
                  <Route path="contas" element={<Manage />} />
                  <Route path="perfil" element={<Profile />} />
                  <Route path="configuracoes" element={<Settings />} />
                  <Route path="mais" element={<More />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  );
}
