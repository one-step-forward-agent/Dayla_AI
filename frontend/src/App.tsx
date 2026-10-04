import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { NavigationBridge } from "@/app/router";
import { ToastProvider } from "@/app/components/ui";
import { OnboardingProvider } from "@/components/onboarding/OnboardingContext";
import { Start } from "@/components/onboarding/Start";
import AuthLayout from "@/layouts/AuthLayout";
import LoginPage from "@/pages/Auth/LoginPage";
import RegisterPage from "@/pages/Auth/RegisterPage";
import { useAuthStore } from "@/store/authStore";
import { ThemeProvider, ThemeToggle } from "@/theme";

const AppRoutes = lazy(() => import("@/app/AppRoutes"));
const ForWhatUsing = lazy(() => import("@/components/onboarding/ForWhatUsing").then((module) => ({ default: module.ForWhatUsing })));
const FieldOfActivity = lazy(() => import("@/components/onboarding/FieldOfActivity").then((module) => ({ default: module.FieldOfActivity })));
const ToneOfVoice = lazy(() => import("@/components/onboarding/ToneOfVoice").then((module) => ({ default: module.ToneOfVoice })));
const GoalsAndHabits = lazy(() => import("@/components/onboarding/GoalsAndHabits").then((module) => ({ default: module.GoalsAndHabits })));
const ExistingPlans = lazy(() => import("@/components/onboarding/ExistingPlans").then((module) => ({ default: module.ExistingPlans })));
const AppleAndGoogleLogging = lazy(() => import("@/components/onboarding/AppleAndGoogleLogging").then((module) => ({ default: module.AppleAndGoogleLogging })));
const SourcesImport = lazy(() => import("@/components/onboarding/SourcesImport").then((module) => ({ default: module.SourcesImport })));
const FastTasksEnter = lazy(() => import("@/components/onboarding/FastTasksEnter").then((module) => ({ default: module.FastTasksEnter })));
const LetsPlanTomorrow = lazy(() => import("@/components/onboarding/LetsPlanTomorrow").then((module) => ({ default: module.LetsPlanTomorrow })));
const SuccessAndLearning = lazy(() => import("@/components/onboarding/SuccessAndLearning").then((module) => ({ default: module.SuccessAndLearning })));
const TermsOfUsePage = lazy(() => import("@/pages/Documents/TermsOfUsePage"));
const PersonalDataConsentPage = lazy(() => import("@/pages/Documents/PersonalDataConsentPage"));

function FullScreenLoader() {
  return (
    <div className="flex h-dvh items-center justify-center bg-white dark:bg-gray-950" role="status" aria-label="Загрузка">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { search } = useLocation();
  if (isLoading) return <FullScreenLoader />;
  return isAuthenticated ? <Navigate to={`/app${search}`} replace /> : <Start />;
}

function OnboardingRouteLayout() {
  return (
    <OnboardingProvider>
      <Outlet />
    </OnboardingProvider>
  );
}

function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-white px-4 text-center dark:bg-gray-950">
      <p className="text-7xl font-semibold tracking-tight text-gray-900 dark:text-white">404</p>
      <p className="text-lg text-gray-600 dark:text-gray-400">Страница не найдена</p>
      <Link to="/" className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 font-medium text-white hover:opacity-90">
        На главную
      </Link>
      <ThemeToggle className="fixed right-4 top-4" />
    </div>
  );
}

function Routing() {
  const loadUser = useAuthStore((state) => state.loadUser);
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <NavigationBridge />
      <Routes>
        <Route path="/" element={<RootRoute />} />

        <Route element={<OnboardingRouteLayout />}>
          <Route path="/onboarding" element={<Navigate to="/onboarding/for-what-using" replace />} />
          <Route path="/onboarding/start" element={<Navigate to="/" replace />} />
          <Route path="/onboarding/for-what-using" element={<ForWhatUsing />} />
          <Route path="/onboarding/field-of-activity" element={<FieldOfActivity />} />
          <Route path="/onboarding/tone-of-voice" element={<ToneOfVoice />} />
          <Route path="/onboarding/goals-and-habits" element={<GoalsAndHabits />} />
          <Route path="/onboarding/existing-plans" element={<ExistingPlans />} />
          <Route path="/onboarding/apple-google-logging" element={<AppleAndGoogleLogging />} />
          <Route path="/onboarding/sources-import" element={<SourcesImport />} />
          <Route path="/onboarding/fast-tasks-enter" element={<FastTasksEnter />} />
          <Route path="/onboarding/lets-plan-tomorrow" element={<LetsPlanTomorrow />} />
          <Route path="/onboarding/success-and-learning" element={<SuccessAndLearning />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/terms-of-use" element={<TermsOfUsePage />} />
        <Route path="/personal-data-consent" element={<PersonalDataConsentPage />} />

        <Route path="/app/*" element={<AppRoutes />} />
        <Route path="/dashboard/*" element={<Navigate to="/app" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routing />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
