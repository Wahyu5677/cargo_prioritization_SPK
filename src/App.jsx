import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Criteria from "./pages/Criteria";
import CargoManagement from "./pages/CargoManagement";
import ScheduleOutput from "./pages/ScheduleOutput";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-sm text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-semibold text-slate-700">
          Loading secure session...
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute() {
  const { initialLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (initialLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function PublicOnlyRoute() {
  const { initialLoading, isAuthenticated } = useAuth();

  if (initialLoading) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Sidebar />}>
          <Route index element={<Dashboard />} />
          <Route path="/criteria" element={<Criteria />} />
          <Route path="/cargo" element={<CargoManagement />} />
          <Route path="/schedule" element={<ScheduleOutput />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}