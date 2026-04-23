"use client";

import { useState } from "react";

export interface BaselineFormData {
  address: string;
  rent_monthly: number;
  surface_sqft: number;
  num_bedrooms: number;
  num_bathrooms: number;
  floor: number | null;
  has_balcony: boolean;
  has_dishwasher: boolean;
  has_laundry_inunit: boolean;
  has_parking: boolean;
  pet_friendly: boolean;
  commute_work_address: string;
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
  submitText = "Enregistrer mon baseline",
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
    has_balcony: initialData?.has_balcony || false,
    has_dishwasher: initialData?.has_dishwasher || false,
    has_laundry_inunit: initialData?.has_laundry_inunit || false,
    has_parking: initialData?.has_parking || false,
    pet_friendly: initialData?.pet_friendly || false,
    commute_work_address: initialData?.commute_work_address || "",
    priorities: initialData?.priorities || { price: 5, space: 5, commute: 5, amenities: 5, quality: 5 },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
  };

  const set = <K extends keyof BaselineFormData>(field: K, value: BaselineFormData[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setPriority = (field: string, value: number) =>
    setForm((prev) => ({
      ...prev,
      priorities: { ...prev.priorities, [field]: value },
    }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Ton appartement actuel</h2>

      {/* Infos principales */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="123 rue Saint-Denis, Montréal"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Loyer mensuel ($)</label>
          <input
            type="number"
            value={form.rent_monthly || ""}
            onChange={(e) => set("rent_monthly", Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Surface (sqft)</label>
          <input
            type="number"
            value={form.surface_sqft || ""}
            onChange={(e) => set("surface_sqft", Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Chambres</label>
          <select
            value={form.num_bedrooms}
            onChange={(e) => set("num_bedrooms", Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Salles de bain</label>
          <select
            value={form.num_bathrooms}
            onChange={(e) => set("num_bathrooms", Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Équipements */}
      <div>
        <h3 className="text-sm font-medium mb-2">Équipements actuels</h3>
        <div className="flex flex-wrap gap-3">
          {([
            { key: "has_balcony" as const, label: "Balcon" },
            { key: "has_dishwasher" as const, label: "Lave-vaisselle" },
            { key: "has_laundry_inunit" as const, label: "Laveuse/sécheuse" },
            { key: "has_parking" as const, label: "Stationnement" },
            { key: "pet_friendly" as const, label: "Animaux acceptés" },
          ]).map(({ key, label }) => (
            <label
              key={key}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm border transition-colors ${
                form[key]
                  ? "bg-blue-100 border-blue-400 text-blue-800"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Adresse travail */}
      <div>
        <label className="block text-sm font-medium mb-1">Adresse de travail (pour le trajet)</label>
        <input
          type="text"
          value={form.commute_work_address}
          onChange={(e) => set("commute_work_address", e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="500 Place d'Armes, Montréal"
        />
      </div>

      {/* Priorités */}
      <div>
        <h3 className="text-sm font-medium mb-3">Tes priorités (importance de 1 à 10)</h3>
        <div className="space-y-3">
          {[
            { key: "price", label: "Prix" },
            { key: "space", label: "Espace" },
            { key: "commute", label: "Trajet" },
            { key: "amenities", label: "Équipements" },
            { key: "quality", label: "Qualité" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-28 text-sm">{label}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={form.priorities[key as keyof typeof form.priorities]}
                onChange={(e) => setPriority(key, Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-center text-sm font-medium">
                {form.priorities[key as keyof typeof form.priorities]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
      >
        {submitText}
      </button>
    </form>
  );
}
