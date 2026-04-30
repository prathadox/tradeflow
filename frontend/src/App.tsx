import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Toaster from "./ui/Toast";
import { isPreviewUnlocked } from "./lib/preview";

const WorkflowBuilder = lazy(() => import("./pages/WorkflowBuilder"));

function GatedBuilder() {
  if (!isPreviewUnlocked()) {
    return <Navigate to="/#waitlist" replace />;
  }
  return (
    <Suspense fallback={<BuilderFallback />}>
      <WorkflowBuilder />
    </Suspense>
  );
}

function BuilderFallback() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        background: "var(--bg-canvas)",
      }}
    >
      Loading builder…
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<GatedBuilder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
