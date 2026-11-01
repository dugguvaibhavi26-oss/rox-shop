"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  PLATFORM_PLANS,
  PLAN_IDS,
  UNLIMITED,
  getAllPlanAccess,
  getDefaultPlanAccess,
  type PlanAccess,
  type PlanId,
} from "@/lib/plans";
import { storeService } from "@/lib/store-service";

type FeatureKey = "coupons" | "reviews" | "email" | "customDomain";

const FEATURES: { key: FeatureKey; label: string; hint: string }[] = [
  { key: "coupons", label: "Discount coupons", hint: "Create codes, coupon box at checkout" },
  { key: "reviews", label: "Customer reviews", hint: "Star ratings and review moderation" },
  { key: "email", label: "Email integration", hint: "Gmail alerts and store newsletter" },
  { key: "customDomain", label: "Custom domain", hint: "Connect their own yourshop.in" },
];

/** Admin: what each plan unlocks. Saved settings apply to every store on that plan straight away. */
export function PlanAccessManager({ storesByPlan }: { storesByPlan: Record<PlanId, number> }) {
  const [draft, setDraft] = useState<Record<PlanId, PlanAccess>>(getAllPlanAccess);
  const [savedToast, setSavedToast] = useState(false);
  const live = JSON.stringify(getAllPlanAccess());
  const dirty = JSON.stringify(draft) !== live;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Pick up changes saved on another device, unless there are unsaved edits here
  useEffect(
    () =>
      storeService.subscribe(() => {
        if (!dirtyRef.current) setDraft(getAllPlanAccess());
      }),
    []
  );

  const set = (id: PlanId, patch: Partial<PlanAccess>) => setDraft((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const save = () => {
    storeService.savePlanAccess(draft);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const reset = () => {
    if (!window.confirm("Put every plan back to its default features and limits?")) return;
    storeService.resetPlanAccess();
    setDraft(getDefaultPlanAccess());
  };

  const numberCell = (id: PlanId, key: "maxProducts" | "maxBanners", allowUnlimited: boolean) => {
    const value = draft[id][key];
    const unlimited = value >= UNLIMITED;
    return (
      <div className="flex flex-col items-center gap-1.5">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          aria-label={`${PLATFORM_PLANS[id].name} ${key === "maxProducts" ? "product" : "banner"} limit`}
          disabled={unlimited}
          value={unlimited ? "" : value}
          placeholder={unlimited ? "∞" : ""}
          onChange={(e) => set(id, { [key]: Math.max(0, Math.min(UNLIMITED - 1, Number(e.target.value) || 0)) })}
          className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-center text-xs font-semibold text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:bg-neutral-50"
        />
        {allowUnlimited && (
          <label className="flex items-center gap-1 text-[10px] text-neutral-500">
            <input
              type="checkbox"
              checked={unlimited}
              onChange={(e) => set(id, { [key]: e.target.checked ? UNLIMITED : 100 })}
              className="h-3 w-3 accent-neutral-900"
            />
            Unlimited
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
            <span>Feature access by plan</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Choose what each plan unlocks. Saving applies it to every store on that plan right away.
          </p>
        </div>
        {savedToast && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <Check className="w-3.5 h-3.5" />
            Saved for all stores
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full min-w-[520px] text-xs">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Feature</th>
              {PLAN_IDS.map((id) => (
                <th key={id} className="px-3 py-3 text-center font-semibold">
                  <span className="block text-neutral-900">{PLATFORM_PLANS[id].name}</span>
                  <span className="block text-[10px] font-normal text-neutral-400">
                    {storesByPlan[id]} store{storesByPlan[id] === 1 ? "" : "s"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            <tr>
              <td className="px-4 py-3">
                <span className="block font-semibold text-neutral-900">Products</span>
                <span className="block text-[11px] text-neutral-500">Most products a store can list</span>
              </td>
              {PLAN_IDS.map((id) => (
                <td key={id} className="px-3 py-3">
                  {numberCell(id, "maxProducts", true)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3">
                <span className="block font-semibold text-neutral-900">Homepage banners</span>
                <span className="block text-[11px] text-neutral-500">Most banners in the store slider</span>
              </td>
              {PLAN_IDS.map((id) => (
                <td key={id} className="px-3 py-3">
                  {numberCell(id, "maxBanners", false)}
                </td>
              ))}
            </tr>
            {FEATURES.map((f) => (
              <tr key={f.key}>
                <td className="px-4 py-3">
                  <span className="block font-semibold text-neutral-900">{f.label}</span>
                  <span className="block text-[11px] text-neutral-500">{f.hint}</span>
                </td>
                {PLAN_IDS.map((id) => {
                  const on = draft[id][f.key];
                  return (
                    <td key={id} className="px-3 py-3 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={`${f.label} on ${PLATFORM_PLANS[id].name}`}
                        onClick={() => set(id, { [f.key]: !on })}
                        style={{ minHeight: 0, height: 24 }}
                        className={`relative inline-block w-11 rounded-full align-middle transition-colors ${on ? "bg-emerald-500" : "bg-neutral-300"}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to defaults
        </button>
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              type="button"
              onClick={() => setDraft(getAllPlanAccess())}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
