import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DataProvider } from "@/contexts/DataContext";
import { ToastProvider } from "@/components/ui/Toast";
import { Logo } from "@/components/brand/Logo";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { AccountsPage } from "@/pages/AccountsPage";
import { BudgetPage } from "@/pages/BudgetPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { MorePage } from "@/pages/MorePage";
import { BRAND } from "@/brand";

const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ReportsPage = lazy(() => import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const GoalsPage = lazy(() => import("@/pages/GoalsPage").then((m) => ({ default: m.GoalsPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage").then((m) => ({ default: m.ProjectsPage })));
const ProjectPage = lazy(() => import("@/pages/ProjectPage").then((m) => ({ default: m.ProjectPage })));
const CheckupPage = lazy(() => import("@/pages/CheckupPage").then((m) => ({ default: m.CheckupPage })));
const LearnPage = lazy(() => import("@/pages/LearnPage").then((m) => ({ default: m.LearnPage })));
const ToolsPage = lazy(() => import("@/pages/ToolsPage").then((m) => ({ default: m.ToolsPage })));

function PageFallback() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="skeleton" style={{ height: 120 }} />
      <div className="skeleton" style={{ height: 220 }} />
    </div>
  );
}

function Splash() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 800, fontSize: 22, color: "var(--color-text)" }}><Logo size={40} />{BRAND.name}</div>
    </div>
  );
}

function ProtectedArea() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Router() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/cadastro" element={<PublicOnly><SignupPage /></PublicOnly>} />
      <Route path="/esqueci-senha" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedArea />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<PageFallback />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route path="/lancamentos" element={<TransactionsPage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/contas" element={<AccountsPage />} />
        <Route path="/orcamento" element={<BudgetPage />} />
        <Route
          path="/metas"
          element={
            <Suspense fallback={<PageFallback />}>
              <GoalsPage />
            </Suspense>
          }
        />
        <Route
          path="/ferramentas"
          element={
            <Suspense fallback={<PageFallback />}>
              <ToolsPage />
            </Suspense>
          }
        />
        <Route
          path="/relatorios"
          element={
            <Suspense fallback={<PageFallback />}>
              <ReportsPage />
            </Suspense>
          }
        />
        <Route
          path="/perfil"
          element={
            <Suspense fallback={<PageFallback />}>
              <ProfilePage />
            </Suspense>
          }
        />
        <Route path="/projetos" element={<Suspense fallback={<PageFallback />}><ProjectsPage /></Suspense>} />
        <Route path="/projetos/:id" element={<Suspense fallback={<PageFallback />}><ProjectPage /></Suspense>} />
        <Route path="/checkup" element={<Suspense fallback={<PageFallback />}><CheckupPage /></Suspense>} />
        <Route path="/aprender" element={<Suspense fallback={<PageFallback />}><LearnPage /></Suspense>} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/mais" element={<MorePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
