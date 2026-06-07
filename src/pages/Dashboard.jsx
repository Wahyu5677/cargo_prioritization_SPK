import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const [criteria, setCriteria] = useState([]);
  const [totalBatches, setTotalBatches] = useState(0);
  const [latestBatches, setLatestBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [criteriaResult, countResult, latestResult] = await Promise.all([
        supabase.from("criteria").select("*").order("id", { ascending: true }),
        supabase
          .from("cargo_batches")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("cargo_batches")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      if (criteriaResult.error) {
        throw criteriaResult.error;
      }

      if (countResult.error) {
        throw countResult.error;
      }

      if (latestResult.error) {
        throw latestResult.error;
      }

      setCriteria(criteriaResult.data || []);
      setTotalBatches(countResult.count || 0);
      setLatestBatches(latestResult.data || []);
    } catch (error) {
      setErrorMessage(error.message || "Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  }

  const totalWeight = useMemo(
    () => criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0),
    [criteria]
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-600">
          Sistem Pendukung Keputusan
        </p>
        <h1 className="page-title">Ringkasan Dashboard</h1>
        <p className="page-subtitle">
          Pantau alternatif kargo, bobot kriteria, dan model keputusan saat ini
          untuk menentukan prioritas jadwal pengiriman.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewCard
              title="Total Batch Kargo"
              value={totalBatches}
              description="Alternatif yang dimiliki akun Anda"
              icon="📦"
            />
            <OverviewCard
              title="Kriteria Aktif"
              value={criteria.length}
              description="Faktor urgency, stok, dan biaya"
              icon="⚖️"
            />
            <OverviewCard
              title="Total Bobot"
              value={totalWeight}
              description="Digunakan untuk normalisasi WP"
              icon="🧮"
            />
            <OverviewCard
              title="Method"
              value="WP"
              description="Perhitungan Weighted Product"
              icon="🚀"
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <div className="card">
              <h2 className="text-lg font-black text-slate-950">
                Bobot Kriteria Saat Ini
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Bobot ini dinormalisasi saat perhitungan WP. Kriteria cost
                menggunakan eksponen negatif.
              </p>

              <div className="mt-5 space-y-4">
                {criteria.map((item) => {
                  const percentage =
                    totalWeight > 0
                      ? Math.round((Number(item.weight) / totalWeight) * 100)
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">
                            C{item.id}: {item.name}
                          </p>
                          <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                            {item.type}
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-black text-blue-700">
                          {item.weight}
                        </span>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Porsi normalisasi: {percentage}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-black text-slate-950">
                Tujuan Sistem
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                <p>
                  Aplikasi ini membantu tim logistik menentukan batch kargo
                  project mana yang harus dikirim lebih dulu saat ada banyak
                  faktor yang saling bersaing.
                </p>
                <p>
                  Metode Weighted Product mengalikan skor tiap alternatif
                  dengan eksponen bobot yang sudah dinormalisasi. Kriteria
                  benefit menaikkan prioritas, sedangkan kriteria cost
                  menurunkan prioritas melalui eksponen negatif.
                </p>
                <p>
                  Ranking akhir otomatis diubah menjadi kelompok pengiriman
                  praktis: Hari 1 untuk prioritas tertinggi, Hari 2 untuk
                  prioritas menengah, dan Hari 3 untuk sisa kargo.
                </p>
              </div>

              <div className="mt-6 rounded-3xl bg-gradient-to-br from-slate-950 to-blue-900 p-5 text-white">
                <p className="text-sm font-black uppercase tracking-wide text-blue-100">
                  Batch Kargo Terbaru
                </p>

                {latestBatches.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-300">
                    Belum ada batch kargo yang ditambahkan.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {latestBatches.map((batch) => (
                      <div
                        key={batch.id}
                        className="rounded-2xl bg-white/10 px-4 py-3"
                      >
                        <p className="font-bold">{batch.batch_name}</p>
                        <p className="mt-1 text-xs text-blue-100">
                          Urgency {batch.urgency_val} · Stok{" "}
                          {batch.stock_site_val} · Cost{" "}
                          {batch.shipping_cost_val}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function OverviewCard({ title, value, description, icon }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="card animate-pulse">
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="mt-4 h-8 w-16 rounded bg-slate-200" />
          <div className="mt-5 h-4 w-full rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}