import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Criteria() {
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchCriteria();
  }, []);

  async function fetchCriteria() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("criteria")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        throw error;
      }

      setCriteria(data || []);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load criteria.");
    } finally {
      setLoading(false);
    }
  }

  function handleWeightChange(id, value) {
    const numericValue = Number(value);

    setCriteria((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              weight: numericValue
            }
          : item
      )
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const invalidCriteria = criteria.find(
      (item) => !Number.isInteger(Number(item.weight)) || Number(item.weight) <= 0
    );

    if (invalidCriteria) {
      setSaving(false);
      setErrorMessage("All criteria weights must be positive integers.");
      return;
    }

    try {
      const updateRequests = criteria.map((item) =>
        supabase
          .from("criteria")
          .update({
            weight: Number(item.weight)
          })
          .eq("id", item.id)
      );

      const results = await Promise.all(updateRequests);
      const failedResult = results.find((result) => result.error);

      if (failedResult?.error) {
        throw failedResult.error;
      }

      setSuccessMessage("Criteria weights updated successfully.");
      await fetchCriteria();
    } catch (error) {
      setErrorMessage(error.message || "Failed to update criteria.");
    } finally {
      setSaving(false);
    }
  }

  const totalWeight = criteria.reduce(
    (sum, item) => sum + Number(item.weight || 0),
    0
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-600">
          Criteria Configuration
        </p>
        <h1 className="page-title">Criteria Weight Management</h1>
        <p className="page-subtitle">
          Update C1, C2, and C3 weights directly in the Supabase criteria table.
          These values affect the final Weighted Product ranking.
        </p>
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

      <form onSubmit={handleSubmit} className="card">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Weighted Product Criteria
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Total current weight:{" "}
              <span className="font-black text-blue-700">{totalWeight}</span>
            </p>
          </div>

          <button type="submit" disabled={saving || loading} className="btn-primary">
            {saving ? "Saving..." : "Save Weights"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-3xl bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {criteria.map((item) => {
              const normalizedWeight =
                totalWeight > 0 ? Number(item.weight) / totalWeight : 0;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr] md:items-center">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                        C{item.id}
                      </p>
                      <h3 className="mt-1 text-base font-black text-slate-950">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                        Type: {item.type}
                      </p>
                    </div>

                    <div>
                      <label htmlFor={`weight-${item.id}`} className="label">
                        Weight
                      </label>
                      <input
                        id={`weight-${item.id}`}
                        type="number"
                        min="1"
                        step="1"
                        value={item.weight}
                        onChange={(event) =>
                          handleWeightChange(item.id, event.target.value)
                        }
                        className="input"
                      />
                    </div>

                    <div>
                      <p className="label">Normalized Wj</p>
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900">
                        {normalizedWeight.toFixed(4)}
                      </div>
                    </div>

                    <div>
                      <p className="label">Exponent Behavior</p>
                      <div
                        className={`rounded-xl px-4 py-3 text-sm font-black ${
                          item.type === "benefit"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {item.type === "benefit" ? "+Wj" : "-Wj"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </form>
    </div>
  );
}