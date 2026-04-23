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
    priorities: initialData?.priorities || { price: 5, space: 5, commute: 5, amenities: 5, quality: 5 },
  });

  const addrRef = useRef<HTMLInputElement>(null);
  const workRef = useRef<HTMLInputElement>(null);
  const uniRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const setupAutocomplete = (ref: React.RefObject<HTMLInputElement>, field: keyof BaselineFormData) => {
      const g = (window as any).google;
      if (g && g.maps && g.maps.places && ref.current) {
        const autocomplete = new g.maps.places.Autocomplete(ref.current, {
          componentRestrictions: { country: "ca" },
          fields: ["formatted_address", "geometry"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            setForm(prev => ({ ...prev, [field]: place.formatted_address }));
          }
        });
      }
    };

    // Give a small delay to ensure script is loaded
    const timer = setTimeout(() => {
      setupAutocomplete(addrRef, "address");
      setupAutocomplete(workRef, "commute_work_address");
      setupAutocomplete(uniRef, "commute_uni_address");
    }, 1000);
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
              ref={addrRef}
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

      <section className={form.commute_work_address || form.commute_uni_address ? "opacity-100" : "opacity-80 transition-opacity"}>
        <h2 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-6 flex items-center gap-2">
          <span className="w-8 h-px bg-blue-600/20" />
          Tes destinations (Optionnel)
        </h2>
        <div className="space-y-4">
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-opacity ${form.commute_work_address ? "opacity-100" : "opacity-20"}`}>💼</span>
            <input
              ref={workRef}
              type="text"
              value={form.commute_work_address}
              onChange={(e) => set("commute_work_address", e.target.value)}
              className={`w-full rounded-2xl border bg-[var(--card)] pl-12 pr-5 py-4 text-sm transition-all ${form.commute_work_address ? "border-blue-400 ring-2 ring-blue-50" : "border-[var(--card-border)]"}`}
              placeholder="Adresse de Travail"
            />
          </div>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-opacity ${form.commute_uni_address ? "opacity-100" : "opacity-20"}`}>🎓</span>
            <input
              ref={uniRef}
              type="text"
              value={form.commute_uni_address}
              onChange={(e) => set("commute_uni_address", e.target.value)}
              className={`w-full rounded-2xl border bg-[var(--card)] pl-12 pr-5 py-4 text-sm transition-all ${form.commute_uni_address ? "border-blue-400 ring-2 ring-blue-50" : "border-[var(--card-border)]"}`}
              placeholder="Université / Campus"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-6 flex items-center gap-2">
          <span className="w-8 h-px bg-blue-600/20" />
          Tes priorités
        </h2>
        <div className="space-y-6 bg-[var(--surface)] p-6 rounded-3xl border border-[var(--card-border)]">
          {[
            { key: "price", label: "Prix bas", icon: "💰" },
            { key: "space", label: "Grand espace", icon: "📐" },
            { key: "commute", label: "Proximité métro", icon: "⚡" },
            { key: "amenities", label: "Équipements", icon: "✨" },
          ].map(({ key, label, icon }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span>{icon} {label}</span>
                <span className="text-blue-600">{form.priorities[key as keyof typeof form.priorities]}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={form.priorities[key as keyof typeof form.priorities]}
                onChange={(e) => setPriority(key, Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </section>

      <button
        type="submit"
        className="w-full rounded-2xl bg-blue-600 py-5 text-white font-black uppercase tracking-widest hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-100"
      >
        {submitText}
      </button>
    </form>
  );
}
