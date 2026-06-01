import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

function resolveCriterionField(criterion) {
  const name = criterion.name.toLowerCase();

  if (criterion.id === 1 || name.includes("urgency")) {
    return "urgency_val";
  }

  if (criterion.id === 2 || name.includes("stock")) {
    return "stock_site_val";
  }

  if (criterion.id === 3 || name.includes("cost")) {
    return "shipping_cost_val";
  }

  return null;
}

function roundNumber(value, digits = 4) {
  if (!Number.isFinite(value)) {
    return "0.0000";
  }

  return Number(value).toFixed(digits);
}

function formatExponent(value) {
  if (!Number.isFinite(value)) {
    return "0.0000";
  }

  return value >= 0 ? `+${value.toFixed(4)}` : value.toFixed(4);
}

export default function ScheduleOutput() {
  const [criteria, setCriteria] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [criteriaResult, batchResult] = await Promise.all([
        supabase.from("criteria").select("*").order("id", { ascending: true }),
        supabase
          .from("cargo_batches")
          .select("*")
          .order("created_at", { ascending: true })
      ]);

      if (criteriaResult.error) {
        throw criteriaResult.error;
      }

      if (batchResult.error) {
        throw batchResult.error;
      }

      setCriteria(criteriaResult.data || []);
      setBatches(batchResult.data || []);
    } catch (error) {
      setErrorMessage(error.message || "Failed to process WP schedule.");
    } finally {
      setLoading(false);
    }
  }

  const calculation = useMemo(() => {
    const totalWeight = criteria.reduce(
      (sum, item) => sum + Number(item.weight || 0),
      0
    );

    const normalizedCriteria = criteria.map((criterion) => {
      const normalizedWeight =
        totalWeight > 0 ? Number(criterion.weight) / totalWeight : 0;

      const exponent =
        criterion.type === "cost" ? -normalizedWeight : normalizedWeight;

      return {
        ...criterion,
        field: resolveCriterionField(criterion),
        normalizedWeight,
        exponent
      };
    });

    const vectorSRows = batches.map((batch) => {
      const criterionBreakdown = normalizedCriteria.map((criterion) => {
        const rawValue = Number(batch[criterion.field] || 1);
        const powerResult = Math.pow(rawValue, criterion.exponent);

        return {
          criterionId: criterion.id,
          criterionName: criterion.name,
          type: criterion.type,
          rawValue,
          normalizedWeight: criterion.normalizedWeight,
          exponent: criterion.exponent,
          powerResult,
          formulaText: `${rawValue}^(${roundNumber(
            criterion.exponent
          )}) = ${roundNumber(powerResult)}`
        };
      });

      const vectorS = criterionBreakdown.reduce(
        (product, item) => product * item.powerResult,
        1
      );

      const formulaText = criterionBreakdown
        .map((item) => `${item.rawValue}^(${roundNumber(item.exponent)})`)
        .join(" × ");

      const resultText = criterionBreakdown
        .map((item) => roundNumber(item.powerResult))
        .join(" × ");

      return {
        ...batch,
        vectorS,
        criterionBreakdown,
        formulaText,
        resultText
      };
    });

    const totalVectorS = vectorSRows.reduce(
      (sum, batch) => sum + Number(batch.vectorS || 0),
      0
    );

    const rankedRows = vectorSRows
      .map((batch) => ({
        ...batch,
        vectorV: totalVectorS > 0 ? batch.vectorS / totalVectorS : 0,
        vectorVFormulaText: `${roundNumber(batch.vectorS)} / ${roundNumber(
          totalVectorS
        )} = ${roundNumber(totalVectorS > 0 ? batch.vectorS / totalVectorS : 0)}`
      }))
      .sort((a, b) => b.vectorV - a.vectorV)
      .map((batch, index) => ({
        ...batch,
        rank: index + 1
      }));

    const deliveryGroups = [
      {
        key: "day-1",
        title: "TRUCK 1 / DAY 1 DELIVERY",
        subtitle: "High Priority",
        description: "Rank 1-2 cargo batches with the highest priority score.",
        badgeClass: "bg-emerald-100 text-emerald-700",
        cardClass: "border-emerald-200 bg-emerald-50/80",
        batches: rankedRows.filter((batch) => batch.rank >= 1 && batch.rank <= 2)
      },
      {
        key: "day-2",
        title: "TRUCK 2 / DAY 2 DELIVERY",
        subtitle: "Medium Priority",
        description: "Rank 3-4 cargo batches scheduled after urgent deliveries.",
        badgeClass: "bg-blue-100 text-blue-700",
        cardClass: "border-blue-200 bg-blue-50/80",
        batches: rankedRows.filter((batch) => batch.rank >= 3 && batch.rank <= 4)
      },
      {
        key: "day-3",
        title: "DAY 3 DELIVERY",
        subtitle: "Low Priority",
        description: "Rank 5+ cargo batches with lower relative urgency.",
        badgeClass: "bg-slate-200 text-slate-700",
        cardClass: "border-slate-200 bg-slate-50/90",
        batches: rankedRows.filter((batch) => batch.rank >= 5)
      }
    ];

    return {
      totalWeight,
      normalizedCriteria,
      vectorSRows,
      totalVectorS,
      rankedRows,
      deliveryGroups
    };
  }, [criteria, batches]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-600">
            Weighted Product Engine
          </p>
          <h1 className="page-title">Process & Delivery Schedule</h1>
          <p className="page-subtitle">
            Live mathematical breakdown of weight normalization, Vector S,
            Vector V, ranking, and final truck delivery grouping.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="btn-secondary"
        >
          {loading ? "Processing..." : "Refresh Calculation"}
        </button>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : batches.length === 0 ? (
        <div className="card text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-3xl">
            📦
          </div>
          <h2 className="text-xl font-black text-slate-950">
            No cargo data available.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Add cargo batches in Cargo Management before running the Weighted
            Product calculation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <SectionCard
            number="01"
            title="Weight Normalization"
            description="Formula: Wj = wj / SUM(wj). Original criteria weights are converted into proportional normalized weights."
          >
            <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              <p className="font-black">Total Weight Calculation</p>
              <p className="mt-1">
                Total bobot ={" "}
                {calculation.normalizedCriteria
                  .map((criterion) => criterion.weight)
                  .join(" + ")}{" "}
                = <span className="font-black">{calculation.totalWeight}</span>
              </p>
            </div>

            <div className="table-scroll">
              <table className="min-w-[720px] w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-4">Criteria Name</th>
                    <th className="px-4">Original Weight</th>
                    <th className="px-4">Type</th>
                    <th className="px-4">Normalized Weight Wj</th>
                    <th className="px-4">Exponent</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.normalizedCriteria.map((criterion) => (
                    <tr key={criterion.id} className="bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4 font-black text-slate-950">
                        C{criterion.id}: {criterion.name}
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Wj = {criterion.weight} / {calculation.totalWeight} ={" "}
                          {roundNumber(criterion.normalizedWeight)}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-700">
                        {criterion.weight}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                            criterion.type === "benefit"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {criterion.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-black text-blue-700">
                        {roundNumber(criterion.normalizedWeight)}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4 font-black text-slate-700">
                        {formatExponent(criterion.exponent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            number="02"
            title="Vector S Calculation"
            description="Formula: Si = product of every criterion value raised to its normalized exponent. Cost criteria use negative exponents (-Wj)."
          >
            <div className="table-scroll">
              <table className="min-w-[860px] w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-4">Batch Name</th>
                    <th className="px-4">C1 Urgency</th>
                    <th className="px-4">C2 Stock Site</th>
                    <th className="px-4">C3 Shipping Cost</th>
                    <th className="px-4">Vector S</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.vectorSRows.map((batch) => (
                    <tr key={batch.id} className="bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4 font-black text-slate-950">
                        {batch.batch_name}
                      </td>
                      <td className="px-4 py-4">
                        <RawValue value={batch.urgency_val} />
                      </td>
                      <td className="px-4 py-4">
                        <RawValue value={batch.stock_site_val} />
                      </td>
                      <td className="px-4 py-4">
                        <RawValue value={batch.shipping_cost_val} />
                      </td>
                      <td className="rounded-r-2xl px-4 py-4 font-black text-blue-700">
                        {roundNumber(batch.vectorS)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-4">
              {calculation.vectorSRows.map((batch) => (
                <div
                  key={`detail-${batch.id}`}
                  className="rounded-3xl border border-slate-200 bg-white p-5"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                        Detail Perhitungan Vector S
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">
                        {batch.batch_name}
                      </h3>
                    </div>

                    <span className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
                      S = {roundNumber(batch.vectorS)}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-900">
                      Rumus:
                    </p>
                    <p className="mt-2 break-words font-mono text-sm leading-7 text-slate-700">
                      S = {batch.formulaText}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {batch.criterionBreakdown.map((item) => (
                      <div
                        key={`${batch.id}-${item.criterionId}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-black text-slate-950">
                            C{item.criterionId}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                              item.type === "benefit"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {item.type}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-600">
                          {item.criterionName}
                        </p>

                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                          <p>
                            Nilai mentah:{" "}
                            <span className="font-black">{item.rawValue}</span>
                          </p>
                          <p>
                            Pangkat:{" "}
                            <span className="font-black">
                              {formatExponent(item.exponent)}
                            </span>
                          </p>
                          <p className="font-mono text-xs leading-6">
                            {item.formulaText}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-black text-blue-900">
                      Hasil akhir:
                    </p>
                    <p className="mt-2 break-words font-mono text-sm leading-7 text-blue-900">
                      S = {batch.resultText} ={" "}
                      <span className="font-black">
                        {roundNumber(batch.vectorS)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            number="03"
            title="Vector V & Ranking"
            description="Formula: Vi = Si / SUM(Si). Rows are sorted by Vi descending, so the highest value becomes Rank 1."
          >
            <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              <p className="font-black">Total Vector S</p>
              <p className="mt-1 break-words font-mono">
                SUM(S) ={" "}
                {calculation.vectorSRows
                  .map((batch) => roundNumber(batch.vectorS))
                  .join(" + ")}{" "}
                = {roundNumber(calculation.totalVectorS)}
              </p>
            </div>

            <div className="table-scroll">
              <table className="min-w-[860px] w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-4">Rank</th>
                    <th className="px-4">Batch Name</th>
                    <th className="px-4">Vector S</th>
                    <th className="px-4">Formula Vector V</th>
                    <th className="px-4">Final Vector V</th>
                    <th className="px-4">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.rankedRows.map((batch) => (
                    <tr key={batch.id} className="bg-slate-50">
                      <td className="rounded-l-2xl px-4 py-4">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                          {batch.rank}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-black text-slate-950">
                        {batch.batch_name}
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-700">
                        {roundNumber(batch.vectorS)}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs font-bold text-slate-600">
                        {batch.vectorVFormulaText}
                      </td>
                      <td className="px-4 py-4 font-black text-blue-700">
                        {roundNumber(batch.vectorV)}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <PriorityBadge rank={batch.rank} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            number="04"
            title="Final Delivery Schedule"
            description="Rank 1-2 becomes Truck 1 / Day 1, Rank 3-4 becomes Truck 2 / Day 2, and Rank 5+ becomes Day 3 delivery."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {calculation.deliveryGroups.map((group) => (
                <div
                  key={group.key}
                  className={`rounded-3xl border p-5 ${group.cardClass}`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        {group.subtitle}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">
                        {group.title}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${group.badgeClass}`}
                    >
                      {group.batches.length} Batch
                      {group.batches.length === 1 ? "" : "es"}
                    </span>
                  </div>

                  <p className="mb-4 text-sm leading-6 text-slate-600">
                    {group.description}
                  </p>

                  {group.batches.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-center text-sm font-semibold text-slate-500">
                      No cargo assigned.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {group.batches.map((batch) => (
                        <div
                          key={batch.id}
                          className="rounded-2xl bg-white/80 p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-slate-950">
                                Rank {batch.rank}
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-700">
                                {batch.batch_name}
                              </p>
                            </div>
                            <span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                              Vi {roundNumber(batch.vectorV)}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-600">
                            <div className="rounded-xl bg-slate-100 px-2 py-2">
                              U: {batch.urgency_val}
                            </div>
                            <div className="rounded-xl bg-slate-100 px-2 py-2">
                              S: {batch.stock_site_val}
                            </div>
                            <div className="rounded-xl bg-slate-100 px-2 py-2">
                              C: {batch.shipping_cost_val}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

function SectionCard({ number, title, description, children }) {
  return (
    <section className="card">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white">
          {number}
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function RawValue({ value }) {
  return (
    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-white px-3 text-sm font-black text-slate-900 ring-1 ring-slate-200">
      {value}
    </span>
  );
}

function PriorityBadge({ rank }) {
  if (rank <= 2) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
        High Priority
      </span>
    );
  }

  if (rank <= 4) {
    return (
      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
        Medium Priority
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
      Low Priority
    </span>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="card animate-pulse">
          <div className="mb-5 flex gap-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-200" />
            <div className="flex-1">
              <div className="h-5 w-48 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-200" />
            </div>
          </div>
          <div className="h-48 rounded-3xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}