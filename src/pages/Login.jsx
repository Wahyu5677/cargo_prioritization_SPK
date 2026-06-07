import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const { login, register, sendPasswordReset, authActionLoading } = useAuth();
  const { showToast } = useToast();
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";

  const modeContent = {
    login: {
      title: "Selamat Datang Kembali",
      subtitle: "Masuk dengan email dan kata sandi yang sudah terdaftar.",
      button: "Masuk"
    },
    register: {
      title: "Buat Akun",
      subtitle: "Daftarkan akun baru untuk mengakses sistem prioritas kargo.",
      button: "Buat Akun"
    },
    forgot: {
      title: "Lupa Kata Sandi",
      subtitle: "Masukkan email Anda dan kami akan mengirim tautan reset kata sandi.",
      button: "Kirim Tautan Reset"
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
    setShowPassword(false);
    setShowConfirmPassword(false);
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
        showToast("Berhasil masuk.", "success");
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
              Sistem Prioritas Pengiriman Kargo Proyek
            </h1>
            <p className="mt-5 text-base leading-8 text-blue-100">
              Dashboard sistem pendukung keputusan yang aman untuk menentukan
              peringkat pengiriman kargo proyek menggunakan metode Weighted Product.
            </p>
          </div>

          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-100">
              SISTEM PENDUKUNG KEPUTUSAN
            </p>
            <p className="mt-2 text-sm leading-6 text-white/90">
              Evaluasi urgency, sisa stok di site, dan shipping cost untuk
              menghasilkan jadwal pengiriman yang transparan.
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
                Masuk
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
                Daftar
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
                Lupa
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
                  Alamat Email
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
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      className="input pr-12"
                      placeholder="••••••••"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-semibold text-slate-500 hover:text-slate-800"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? "👁️" : "😑"}
                    </button>
                  </div>
                </div>
              )}

              {mode === "register" && (
                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="input pr-12"
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-semibold text-slate-500 hover:text-slate-800"
                      aria-label={
                        showConfirmPassword
                          ? "Sembunyikan konfirmasi kata sandi"
                          : "Tampilkan konfirmasi kata sandi"
                      }
                    >
                      {showConfirmPassword ? "👁️" : "😑"}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={authActionLoading}
                className="btn-primary w-full"
              >
                {authActionLoading ? "Memproses..." : modeContent[mode].button}
              </button>
            </form>

            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
              {mode === "login" && (
                <p>
                  Belum punya akun? Klik Daftar. Lupa kata sandi? Klik Lupa.
                </p>
              )}

              {mode === "register" && (
                <p>
                  Setelah pendaftaran, Anda mungkin perlu konfirmasi email
                  sebelum masuk.
                </p>
              )}

              {mode === "forgot" && (
                <p>
                  Tautan reset akan mengarahkan Anda ke halaman reset kata
                  sandi di aplikasi ini.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}