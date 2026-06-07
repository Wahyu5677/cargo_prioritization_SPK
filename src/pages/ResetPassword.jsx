import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkRecoverySession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (isMounted) {
          setHasSession(Boolean(data.session));
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || "Gagal memverifikasi sesi reset.");
          setHasSession(false);
        }
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    checkRecoverySession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
      setCheckingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!password.trim()) {
      setErrorMessage("Kata sandi baru wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) throw error;

      await supabase.auth.signOut();

      setSuccessMessage("Kata sandi berhasil diperbarui.");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            successMessage:
              "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru Anda."
          }
        });
      }, 900);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Gagal memperbarui kata sandi. Silakan minta tautan reset baru."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 shadow-soft sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
            🔑
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            Reset Kata Sandi
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Masukkan kata sandi baru untuk memulihkan akses akun Anda.
          </p>
        </div>

        {checkingSession ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-slate-600">
            Memeriksa sesi reset...
          </div>
        ) : !hasSession ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Sesi reset tidak tersedia atau kedaluwarsa. Silakan minta tautan
              reset kata sandi baru.
            </div>

            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="btn-primary w-full"
            >
              Kembali ke Login
            </button>
          </div>
        ) : (
          <>
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
                <label htmlFor="password" className="label">
                  Kata Sandi Baru
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? "Memperbarui Kata Sandi..." : "Perbarui Kata Sandi"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}