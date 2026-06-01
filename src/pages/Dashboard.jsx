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
      setErrorMessage(error.message || "Failed to load dashboard data.");
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
          Decision Support System
        </p>
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle">
          Monitor cargo alternatives, criteria weights, and the current decision
          model used to prioritize delivery schedules.
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
              title="Total Cargo Batches"
              value={totalBatches}
              description="Alternatives owned by your account"
              icon="📦"
            />
            <OverviewCard
              title="Active Criteria"
              value={criteria.length}
              description="Urgency, stock, and cost factors"
              icon="⚖️"
            />
            <OverviewCard
              title="Total Weight"
              value={totalWeight}
              description="Used for WP normalization"
              icon="🧮"
            />
            <OverviewCard
              title="Method"
              value="WP"
              description="Weighted Product calculation"
              icon="🚀"
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <div className="card">
              <h2 className="text-lg font-black text-slate-950">
                Current Criteria Weights
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                These weights are normalized during the WP calculation. Cost
                criteria use negative exponents.
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
                        Normalized share: {percentage}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-black text-slate-950">
                System Purpose
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                <p>
                  This application helps logistics teams determine which project
                  cargo batches should be delivered first when there are
                  multiple competing factors.
                </p>
                <p>
                  The Weighted Product method multiplies each alternative score
                  with normalized weighted exponents. Benefit criteria increase
                  priority, while cost criteria reduce priority through negative
                  exponents.
                </p>
                <p>
                  The final ranking is automatically converted into practical
                  delivery groups: Day 1 for highest priority, Day 2 for medium
                  priority, and Day 3 for the remaining cargo.
                </p>
              </div>

              <div className="mt-6 rounded-3xl bg-gradient-to-br from-slate-950 to-blue-900 p-5 text-white">
                <p className="text-sm font-black uppercase tracking-wide text-blue-100">
                  Latest Cargo Batches
                </p>

                {latestBatches.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-300">
                    No cargo batches added yet.
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
                          Urgency {batch.urgency_val} · Stock{" "}
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