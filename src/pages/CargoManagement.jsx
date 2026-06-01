import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  batch_name: "",
  urgency_val: 1,
  stock_site_val: 1,
  shipping_cost_val: 1
};

const scoreOptions = [1, 2, 3, 4, 5];

export default function CargoManagement() {
  const { user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("cargo_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setBatches(data || []);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load cargo batches.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "batch_name"
          ? value
          : Math.min(5, Math.max(1, Number(value)))
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function validateForm() {
    if (!form.batch_name.trim()) {
      return "Batch name is required.";
    }

    const values = [
      Number(form.urgency_val),
      Number(form.stock_site_val),
      Number(form.shipping_cost_val)
    ];

    const hasInvalidScore = values.some(
      (value) => !Number.isInteger(value) || value < 1 || value > 5
    );

    if (hasInvalidScore) {
      return "All criterion scores must be integers from 1 to 5.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setSaving(false);
      setErrorMessage(validationError);
      return;
    }

    const payload = {
      batch_name: form.batch_name.trim(),
      urgency_val: Number(form.urgency_val),
      stock_site_val: Number(form.stock_site_val),
      shipping_cost_val: Number(form.shipping_cost_val)
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("cargo_batches")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          throw error;
        }

        setSuccessMessage("Cargo batch updated successfully.");
      } else {
        const { error } = await supabase.from("cargo_batches").insert({
          ...payload,
          user_id: user.id
        });

        if (error) {
          throw error;
        }

        setSuccessMessage("Cargo batch created successfully.");
      }

      resetForm();
      await fetchBatches();
    } catch (error) {
      setErrorMessage(error.message || "Failed to save cargo batch.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(batch) {
    setEditingId(batch.id);
    setForm({
      batch_name: batch.batch_name,
      urgency_val: batch.urgency_val,
      stock_site_val: batch.stock_site_val,
      shipping_cost_val: batch.shipping_cost_val
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function handleDelete(batch) {
    const confirmed = window.confirm(
      `Delete cargo batch "${batch.batch_name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("cargo_batches")
        .delete()
        .eq("id", batch.id);

      if (error) {
        throw error;
      }

      setSuccessMessage("Cargo batch deleted successfully.");
      await fetchBatches();
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete cargo batch.");
    }
  }

  const averageScores = useMemo(() => {
    if (batches.length === 0) {
      return {
        urgency: 0,
        stock: 0,
        cost: 0
      };
    }

    const totals = batches.reduce(
      (accumulator, batch) => ({
        urgency: accumulator.urgency + Number(batch.urgency_val),
        stock: accumulator.stock + Number(batch.stock_site_val),
        cost: accumulator.cost + Number(batch.shipping_cost_val)
      }),
      {
        urgency: 0,
        stock: 0,
        cost: 0
      }
    );

    return {
      urgency: totals.urgency / batches.length,
      stock: totals.stock / batches.length,
      cost: totals.cost / batches.length
    };
  }, [batches]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-600">
          Cargo Alternatives
        </p>
        <h1 className="page-title">Cargo Batch Management</h1>
        <p className="page-subtitle">
          Create, edit, and delete project cargo alternatives. Each criterion
          score is restricted from 1 to 5.
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

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.4fr]">
        <form onSubmit={handleSubmit} className="card h-fit">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-950">
              {editingId ? "Edit Cargo Batch" : "Add New Cargo Batch"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Scores: 1 = very low, 5 = very high.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="batch_name" className="label">
                Batch Name
              </label>
              <input
                id="batch_name"
                name="batch_name"
                type="text"
                value={form.batch_name}
                onChange={handleChange}
                className="input"
                placeholder="Example: Cargo Batch A"
              />
            </div>

            <ScoreSelect
              id="urgency_val"
              label="C1 - Urgency"
              value={form.urgency_val}
              onChange={handleChange}
            />

            <ScoreSelect
              id="stock_site_val"
              label="C2 - Remaining Stock at Site"
              value={form.stock_site_val}
              onChange={handleChange}
            />

            <ScoreSelect
              id="shipping_cost_val"
              label="C3 - Shipping Cost"
              value={form.shipping_cost_val}
              onChange={handleChange}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Batch"
                    : "Create Batch"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="btn-secondary"
              >
                Reset
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <MiniMetric
              label="Avg. Urgency"
              value={averageScores.urgency.toFixed(2)}
              icon="🔥"
            />
            <MiniMetric
              label="Avg. Stock Score"
              value={averageScores.stock.toFixed(2)}
              icon="🏗️"
            />
            <MiniMetric
              label="Avg. Cost Score"
              value={averageScores.cost.toFixed(2)}
              icon="💰"
            />
          </div>

          <div className="card">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Cargo Batch List
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Total records: {batches.length}
                </p>
              </div>

              <button
                type="button"
                onClick={fetchBatches}
                disabled={loading}
                className="btn-secondary"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : batches.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-lg font-black text-slate-800">
                  No cargo batches yet.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Add your first cargo batch to start WP prioritization.
                </p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="min-w-[760px] w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      <th className="px-4">Batch Name</th>
                      <th className="px-4">Urgency</th>
                      <th className="px-4">Stock Site</th>
                      <th className="px-4">Shipping Cost</th>
                      <th className="px-4">Created</th>
                      <th className="px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((batch) => (
                      <tr key={batch.id} className="bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4">
                          <p className="font-black text-slate-950">
                            {batch.batch_name}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <ScoreBadge value={batch.urgency_val} />
                        </td>
                        <td className="px-4 py-4">
                          <ScoreBadge value={batch.stock_site_val} />
                        </td>
                        <td className="px-4 py-4">
                          <ScoreBadge value={batch.shipping_cost_val} />
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-500">
                          {formatDate(batch.created_at)}
                        </td>
                        <td className="rounded-r-2xl px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(batch)}
                              className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(batch)}
                              className="rounded-xl bg-red-100 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ScoreSelect({ id, label, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select id={id} name={id} value={value} onChange={onChange} className="input">
        {scoreOptions.map((score) => (
          <option key={score} value={score}>
            {score}
          </option>
        ))}
      </select>
    </div>
  );
}

function ScoreBadge({ value }) {
  return (
    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-black text-white">
      {value}
    </span>
  );
}

function MiniMetric({ label, value, icon }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}