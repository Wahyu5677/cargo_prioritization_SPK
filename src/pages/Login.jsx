import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register, sendPasswordReset, authActionLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ""
  );

  const redirectTo = location.state?.from?.pathname || "/";

  const modeContent = {
    login: {
      title: "Welcome Back",
      subtitle: "Sign in with your registered email and password.",
      button: "Sign In"
    },
    register: {
      title: "Create Account",
      subtitle: "Register a new account to access the cargo priority system.",
      button: "Create Account"
    },
    forgot: {
      title: "Forgot Password",
      subtitle: "Enter your email and we will send a password reset link.",
      button: "Send Reset Link"
    }
  };

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setErrorMessage("");
    setSuccessMessage("");
    setForm({
      email: "",
      password: "",
      confirmPassword: ""
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function validateForm() {
    if (!form.email.trim()) {
      return "Email is required.";
    }

    if (mode === "forgot") {
      return "";
    }

    if (!form.password.trim()) {
      return "Password is required.";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (mode === "register" && form.password !== form.confirmPassword) {
      return "Password confirmation does not match.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (mode === "login") {
      const result = await login(form.email.trim(), form.password);

      if (result.success) {
        navigate(redirectTo, { replace: true });
      } else {
        setErrorMessage(result.message);
      }

      return;
    }

    if (mode === "register") {
      const result = await register(form.email.trim(), form.password);

      if (result.success) {
        if (result.session) {
          navigate("/", { replace: true });
          return;
        }

        setMode("login");
        setSuccessMessage(
          "Account created successfully. Please check your email for confirmation before signing in."
        );
        setForm({
          email: form.email,
          password: "",
          confirmPassword: ""
        });
      } else {
        setErrorMessage(result.message);
      }

      return;
    }

    if (mode === "forgot") {
      const result = await sendPasswordReset(form.email.trim());

      if (result.success) {
        setSuccessMessage(
          "Password reset link has been sent. Please check your email inbox."
        );
      } else {
        setErrorMessage(result.message);
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-soft lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-4xl shadow-lg">
              🚚
            </div>
            <h1 className="text-4xl font-black leading-tight">
              Project Cargo Delivery Prioritization System
            </h1>
            <p className="mt-5 text-base leading-8 text-blue-100">
              Secure decision support dashboard for ranking project cargo
              deliveries using the Weighted Product method.
            </p>
          </div>

          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              DECISION SUPPORT SYSTEM
            </p>
            <p className="mt-2 text-sm leading-6 text-white/90">
              Evaluate urgency, remaining site stock, and shipping cost to
              generate transparent delivery schedules.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl lg:mx-0">
                {mode === "login" ? "🔐" : mode === "register" ? "📝" : "🔑"}
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-950">
                {modeContent[mode].title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {modeContent[mode].subtitle}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                  mode === "login"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("register")}
                className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                  mode === "register"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Register
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("forgot")}
                className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                  mode === "forgot"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Forgot
              </button>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </div>

              {mode !== "forgot" && (
                <div>
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input"
                    placeholder="••••••••"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </div>
              )}

              {mode === "register" && (
                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="input"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authActionLoading}
                className="btn-primary w-full"
              >
                {authActionLoading ? "Processing..." : modeContent[mode].button}
              </button>
            </form>

            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
              {mode === "login" && (
                <p>
                  Do not have an account? Click Register. Forgot your password?
                  Click Forgot.
                </p>
              )}

              {mode === "register" && (
                <p>
                  After registration, you may need to confirm your email before
                  signing in.
                </p>
              )}

              {mode === "forgot" && (
                <p>
                  The reset link will redirect you to the password reset page in
                  this application.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}