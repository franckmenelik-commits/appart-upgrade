"use client";

import { useEffect, useRef, useState } from "react";
import TagInput from "./TagInput";

declare global {
  interface Window {
    google: any;
  }
}

export interface BaselineFormData {
  address: string;
  rent_monthly: number;
  surface_sqft: number;
  num_bedrooms: number;
  num_bathrooms: number;
  floor: number | null;
  amenities_current: string[];
  amenities_desired: string[];
  commute_work_address: string;
  commute_uni_address: string;
  prefer_equidistance: boolean;
  priorities: {
    price: number;
    space: number;
    commute: number;
    amenities: number;
    quality: number;
  };
}

export default function BaselineForm({
  onSubmit,
  initialData,
  submitText = "C'est parti",
}: {
  onSubmit: (data: BaselineFormData) => void;
  initialData?: Partial<BaselineFormData>;
  submitText?: string;
}) {
  const [form, setForm] = useState<BaselineFormData>({
    address: initialData?.address || "",
    rent_monthly: initialData?.rent_monthly || 0,
    surface_sqft: initialData?.surface_sqft || 0,
    num_bedrooms: initialData?.num_bedrooms || 1,
    num_bathrooms: initialData?.num_bathrooms || 1,
    floor: initialData?.floor ?? null,
    amenities_current: Array.isArray(initialData?.amenities_current) ? initialData.amenities_current : [],
    amenities_desired: Array.isArray(initialData?.amenities_desired) ? initialData.amenities_desired : [],
    commute_work_address: initialData?.commute_work_address || "",
    commute_uni_address: initialData?.commute_uni_address || "",
    prefer_equidistance: initialData?.prefer_equidistance || false,
    priorities: initialData?.priorities || { price: 5, space: 5, commute: 5, amenities: 5, quality: 5 },
  });

  const addrRef = useRef<HTMLInputElement>(null);
  const workRef = useRef<HTMLInputElement>(null);
  const uniRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const setupAutocomplete = async (id: string, field: keyof BaselineFormData) => {
      const g = (window as any).google;
      if (!g) return;

      try {
        await g.maps.importLibrary("places");
        const inputElement = document.getElementById(id) as HTMLInputElement;
        if (!inputElement) return;

        // Use the modern PlaceAutocompleteElement (wrapped for standard inputs)
        const autocomplete = new g.maps.places.Autocomplete(inputElement, {
          componentRestrictions: { country: "ca" },
          fields: ["formatted_address", "geometry"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place && place.formatted_address) {
            setForm(prev => ({ ...prev, [field]: place.formatted_address }));
          }
        });
      } catch (err) {
        console.error("Autocomplete setup failed:", err);
      }
    };

    const timer = setTimeout(() => {
      setupAutocomplete("main-addr", "address");
      setupAutocomplete("work-addr", "commute_work_address");
      setupAutocomplete("uni-addr", "commute_uni_address");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
  };

  const set = <K extends keyof BaselineFormData,>(field: K, value: BaselineFormData[K]): void =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setPriority = (field: string, value: number) =>
    setForm((prev) => ({
      ...prev,
      priorities: { ...prev.priorities, [field]: value },
    }));

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-6 flex items-center gap-2">
          <span className="w-8 h-px bg-blue-600/20" />
          Votre nid actuel (Requis)
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-2 flex justify-between">
              <span>Adresse Résidentielle</span>
              <span className="text-blue-500 font-bold text-[8px] border border-blue-200 px-1 rounded">REQUIS</span>
            </label>
            <input
              id="main-addr"
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 text-sm shadow-sm focus:ring-2 ring-blue-100"
              placeholder="Ex: 123 rue Saint-Denis, Montréal"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-2 flex justify-between">
                <span>Loyer ($/mois)</span>
                <span className="text-blue-500 font-bold text-[8px] border border-blue-200 px-1 rounded">REQUIS</span>
              </label>
              <input
                type="number"
                value={form.rent_monthly || ""}
                onChange={(e) => set("rent_monthly", Number(e.target.value))}
                className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-2 flex justify-between">
                <span>Surface (sqft)</span>
                <span className="text-blue-500 font-bold text-[8px] border border-blue-200 px-1 rounded">REQUIS</span>
              </label>
              <input
                type="number"
                value={form.surface_sqft || ""}
                onChange={(e) => set("surface_sqft", Number(e.target.value))}
                className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 text-sm"
                placeholder="Ex: 650"
                required
              />
            </div>
          </div>
        </div>
      </section>

      <section className={form.amenities_current.length > 0 || form.amenities_desired.length > 0 ? "opacity-100" : "opacity-80 transition-opacity"}>
        <h2 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-6 flex items-center gap-2">
          <span className="w-8 h-px bg-blue-600/20" />
          Les équipements (Optionnel)
        </h2>
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-3">Équipements que j&apos;ai déjà</label>
            <TagInput 
              tags={form.amenities_current} 
              onChange={(tags) => set("amenities_current", tags)}
              suggestions={["Lave-vaisselle", "Laveuse/Sécheuse", "Balcon", "Stationnement", "Climatisation"]}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-amber-600 mb-3 underline">Ce qu&apos;il me manque (Rêve)</label>
            <TagInput 
              tags={form.amenities_desired} 
              onChange={(tags) => set("amenities_desired", tags)}
              placeholder="Ex: Cour arrière, Piscine, Casier..."
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-6 flex items-center gap-2">
          <span className="w-8 h-px bg-blue-600/20" />
          Tes destinations & Stratégie
        </h2>
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-opacity opacity-40 group-focus-within:opacity-100 z-10 pointer-events-none">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              id="work-addr"
              type="text"
              value={form.commute_work_address}
              onChange={(e) => set("commute_work_address", e.target.value)}
              className={`w-full rounded-2xl border bg-[var(--card)] pl-12 pr-5 py-4 text-sm transition-all outline-none ${form.commute_work_address ? "border-blue-400 ring-4 ring-blue-50" : "border-[var(--card-border)] focus:border-blue-300"}`}
              placeholder="Adresse de Travail"
            />
          </div>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-opacity opacity-40 group-focus-within:opacity-100 z-10 pointer-events-none">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            </div>
            <input
              id="uni-addr"
              type="text"
              value={form.commute_uni_address}
              onChange={(e) => set("commute_uni_address", e.target.value)}
              className={`w-full rounded-2xl border bg-[var(--card)] pl-12 pr-5 py-4 text-sm transition-all outline-none ${form.commute_uni_address ? "border-blue-400 ring-4 ring-blue-50" : "border-[var(--card-border)] focus:border-blue-300"}`}
              placeholder="Université / Campus"
            />
          </div>
        </div>

        {/* Option Equidistance */}
        {(form.commute_work_address && form.commute_uni_address) && (
          <div className="mt-6 p-5 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="pr-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">Stratégie Trajet</div>
              <div className="text-xs font-bold mb-1">Privilégier l&apos;équidistance ?</div>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">L&apos;algorithme cherchera un point d&apos;équilibre entre tes deux destinations plutôt que de privilégier l&apos;une d&apos;elles.</p>
            </div>
            <button
              type="button"
              onClick={() => set("prefer_equidistance", !form.prefer_equidistance)}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0 shadow-sm ${form.prefer_equidistance ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-800"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${form.prefer_equidistance ? "left-7" : "left-1"}`} />
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-6 flex items-center gap-2">
          <span className="w-8 h-px bg-blue-600/20" />
          Ton Manifeste (Cible)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-3">Budget Loyer Max ($)</label>
            <input
              type="number"
              value={form.search_budget_max || ""}
              onChange={(e) => set("search_budget_max", parseFloat(e.target.value))}
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 text-sm focus:ring-2 ring-blue-100 transition-all outline-none"
              placeholder="Ex: 2500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-3">Surface Min (sqft)</label>
            <input
              type="number"
              value={form.search_surface_min || ""}
              onChange={(e) => set("search_surface_min", parseFloat(e.target.value))}
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 text-sm focus:ring-2 ring-blue-100 transition-all outline-none"
              placeholder="Ex: 800"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-3">Où veux-tu vivre ? (Quartiers)</label>
          <TagInput 
            tags={form.search_neighborhoods || []} 
            onChange={(tags) => set("search_neighborhoods", tags)}
            placeholder="Ex: Vieux-Port, Plateau, Mile-End..."
          />
          <p className="text-[10px] text-[var(--muted)] mt-2 italic">Laisse vide pour chercher partout dans Montréal.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-6 flex items-center gap-2">
          <span className="w-8 h-px bg-blue-600/20" />
          Tes priorités
        </h2>
        <div className="space-y-8 bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--card-border)] shadow-inner">
          {[
            { 
              key: "price", 
              label: "Prix bas", 
              svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            },
            { 
              key: "space", 
              label: "Grand espace", 
              svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            },
            { 
              key: "commute", 
              label: "Proximité métro", 
              svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            },
            { 
              key: "amenities", 
              label: "Équipements", 
              svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
            },
          ].map(({ key, label, svg }) => (
            <div key={key} className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <svg className="w-4 h-4 text-blue-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {svg}
                  </svg>
                  <span>{label}</span>
                </div>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{form.priorities[key as keyof typeof form.priorities]}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={form.priorities[key as keyof typeof form.priorities]}
                onChange={(e) => setPriority(key, Number(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-blue-100 rounded-full appearance-none cursor-pointer"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="pt-8 pb-12">
        <button
          type="submit"
          className="w-full rounded-2xl bg-blue-600 py-5 text-white font-black uppercase tracking-widest hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {submitText}
        </button>
      </div>
      <div className="text-center opacity-20 text-[8px] font-black uppercase tracking-[0.3em] pb-8">
        Vivenza Engine v2.1 — Stable
      </div>
    </form>
  );
}
