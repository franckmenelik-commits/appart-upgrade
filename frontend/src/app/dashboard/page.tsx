"use client";

import ScoreCard from "@/components/ScoreCard";
import { UpgradeScore } from "@/types";

const DEMO_SCORES: UpgradeScore[] = [
  {
    id: "1",
    listing: {
      id: "l1",
      source: "centris",
      source_url: "https://www.centris.ca/fr/condo-appartement~a-louer~montreal-le-plateau-mont-royal/9993977",
      title: "Grand 4 1/2 lumineux — Plateau Mont-Royal",
      address: "4001, Rue Saint-Hubert, app. 4",
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
      image_urls: ["https://mspublic.centris.ca/media.ashx?id=ADDD250DE32555BDDDDDDDDDD4&t=pi&w=640&h=480&sm=c"],
      structured_data: null,
      scraped_at: new Date().toISOString(),
      is_active: true,
    },
    total_score: 87,
    price_score: 75,
    space_score: 90,
    commute_score: 92,
    amenities_score: 80,
    quality_score: 88,
    delta_rent: 150,
    delta_surface: 200,
    delta_commute_minutes: -10,
    highlights: { points: ["Balcon ajoute", "+200 sqft", "Lave-vaisselle"] },
    recommendation: "Excellent upgrade : plus d'espace et plus proche du travail pour seulement 150$/mois de plus.",
    computed_at: new Date().toISOString(),
  },
  {
    id: "2",
    listing: {
      id: "l2",
      source: "centris",
      source_url: "https://www.centris.ca/fr/condo-appartement~a-louer~montreal-ville-marie/22628805",
      title: "Condo moderne — Ville-Marie",
      address: "1656, Rue Atateken, app. 303",
      city: "Montreal",
      rent_monthly: 2050,
      surface_sqft: 720,
      num_bedrooms: 1,
      num_bathrooms: 1,
      has_balcony: true,
      has_dishwasher: true,
      has_laundry_inunit: true,
      has_parking: true,
      pet_friendly: false,
      image_urls: ["https://mspublic.centris.ca/media.ashx?id=ADDD250DE74EA3BDDDDDDDDDDB&t=pi&w=640&h=480&sm=c"],
      structured_data: null,
      scraped_at: new Date().toISOString(),
      is_active: true,
    },
    total_score: 68,
    price_score: 45,
    space_score: 55,
    commute_score: 85,
    amenities_score: 90,
    quality_score: 82,
    delta_rent: 750,
    delta_surface: 70,
    delta_commute_minutes: -15,
    highlights: { points: ["Laveuse incluse", "Parking", "Centre-ville"] },
    recommendation: "Bon condo avec tous les equipements, mais le loyer est 750$ de plus. Justifie seulement si le centre-ville est essentiel.",
    computed_at: new Date().toISOString(),
  },
  {
    id: "3",
    listing: {
      id: "l3",
      source: "marketplace",
      source_url: "#",
      title: "3 1/2 renove pres du metro",
      address: "5605, Avenue Pierre-De Coubertin",
      city: "Montreal",
      rent_monthly: 1100,
      surface_sqft: 550,
      num_bedrooms: 1,
      num_bathrooms: 1,
      has_balcony: false,
      has_dishwasher: false,
      has_laundry_inunit: false,
      has_parking: false,
      pet_friendly: true,
      image_urls: ["https://mspublic.centris.ca/media.ashx?id=ADDD250DE93305EDDDDDDDDDDF&t=pi&w=640&h=480&sm=c"],
      structured_data: null,
      scraped_at: new Date().toISOString(),
      is_active: true,
    },
    total_score: 38,
    price_score: 85,
    space_score: 20,
    commute_score: 40,
    amenities_score: 15,
    quality_score: 45,
    delta_rent: -200,
    delta_surface: -100,
    delta_commute_minutes: 5,
    highlights: { points: ["200$/mois moins cher", "Pres du metro"] },
    recommendation: "Pas un upgrade : tu perds de l'espace et des equipements. Le seul avantage c'est le prix.",
    computed_at: new Date().toISOString(),
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top nav */}
      <nav className="border-b border-[var(--card-border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">V</div>
            <span className="text-lg font-bold">Vivenza</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--muted)]">Plan: <span className="text-[var(--foreground)] font-medium">Gratuit</span></span>
            <span className="text-[var(--muted)]">Scores: <span className="text-[var(--foreground)] font-medium">2/5</span></span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Tes recommandations</h1>
            <p className="text-[var(--muted)] text-sm mt-1">
              {DEMO_SCORES.length} annonces analysees, triees par score
            </p>
          </div>
          <div className="flex gap-2">
            <select className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm">
              <option>Toutes les sources</option>
              <option>Centris</option>
              <option>Marketplace</option>
              <option>Kijiji</option>
            </select>
            <select className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm">
              <option>Score 0+</option>
              <option>Score 50+</option>
              <option>Score 70+</option>
            </select>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEMO_SCORES.map((score) => (
            <ScoreCard key={score.id} score={score} />
          ))}
        </div>
      </div>
    </div>
  );
}
