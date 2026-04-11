"use client";

import ScoreCard from "@/components/ScoreCard";
import { UpgradeScore } from "@/types";

// Données de démo pour le prototype
const DEMO_SCORES: UpgradeScore[] = [
  {
    id: "1",
    listing: {
      id: "l1",
      source: "kijiji",
      source_url: "#",
      title: "Grand 4 1/2 lumineux - Plateau Mont-Royal",
      address: "4521 rue Saint-Denis, Montreal",
      city: "Montreal",
      rent_monthly: 1450,
      surface_sqft: 850,
      num_bedrooms: 2,
      num_bathrooms: 1,
      has_balcony: true,
      has_dishwasher: true,
      has_laundry_inunit: false,
      has_parking: false,
      pet_friendly: true,
      image_urls: [],
      structured_data: null,
      scraped_at: new Date().toISOString(),
      is_active: true,
    },
    total_score: 82,
    price_score: 70,
    space_score: 85,
    commute_score: 90,
    amenities_score: 75,
    quality_score: 88,
    delta_rent: 150,
    delta_surface: 200,
    delta_commute_minutes: -10,
    highlights: { points: ["Balcon ajoute", "+200 sqft", "Lave-vaisselle inclus"] },
    recommendation: "Excellent upgrade : plus d'espace et plus proche du travail pour seulement 150$/mois de plus.",
    computed_at: new Date().toISOString(),
  },
  {
    id: "2",
    listing: {
      id: "l2",
      source: "zumper",
      source_url: "#",
      title: "Studio moderne - Griffintown",
      address: "1200 rue Ottawa, Montreal",
      city: "Montreal",
      rent_monthly: 1600,
      surface_sqft: 500,
      num_bedrooms: 1,
      num_bathrooms: 1,
      has_balcony: false,
      has_dishwasher: true,
      has_laundry_inunit: true,
      has_parking: true,
      pet_friendly: false,
      image_urls: [],
      structured_data: null,
      scraped_at: new Date().toISOString(),
      is_active: true,
    },
    total_score: 45,
    price_score: 30,
    space_score: 20,
    commute_score: 60,
    amenities_score: 80,
    quality_score: 70,
    delta_rent: 300,
    delta_surface: -150,
    delta_commute_minutes: -5,
    highlights: { points: ["Laveuse/secheuse incluse", "Parking inclus"] },
    recommendation: "Pas un upgrade : tu perds 150 sqft pour 300$/mois de plus. Les equipements ne compensent pas.",
    computed_at: new Date().toISOString(),
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Tes recommandations</h1>
            <p className="text-gray-500 text-sm">Tries par score d&apos;upgrade</p>
          </div>
          <div className="flex gap-2">
            <select className="rounded-lg border px-3 py-2 text-sm">
              <option>Toutes les sources</option>
              <option>Kijiji</option>
              <option>Zumper</option>
              <option>Centris</option>
            </select>
            <select className="rounded-lg border px-3 py-2 text-sm">
              <option>Score 50+</option>
              <option>Score 70+</option>
              <option>Tous</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {DEMO_SCORES.map((score) => (
            <ScoreCard key={score.id} score={score} />
          ))}
        </div>
      </div>
    </div>
  );
}
