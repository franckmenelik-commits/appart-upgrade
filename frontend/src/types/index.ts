export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Priorities {
  price: number;
  space: number;
  commute: number;
  amenities: number;
  quality: number;
}

export interface Baseline {
  id: string;
  user_id: string;
  address: string;
  city: string;
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
  commute_work_address: string | null;
  commute_uni_address: string | null;
  commute_minutes: number | null;
  amenities_current: string[] | null;
  amenities_desired: string[] | null;
  priorities: Priorities | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  source: string;
  source_url: string;
  title: string;
  address: string | null;
  city: string;
  rent_monthly: number | null;
  surface_sqft: number | null;
  num_bedrooms: number | null;
  num_bathrooms: number | null;
  has_balcony: boolean | null;
  has_dishwasher: boolean | null;
  has_laundry_inunit: boolean | null;
  has_parking: boolean | null;
  pet_friendly: boolean | null;
  image_urls: string[] | null;
  structured_data: Record<string, unknown> | null;
  scraped_at: string;
  is_active: boolean;
}

export interface UpgradeScore {
  id: string;
  listing: Listing;
  total_score: number;
  price_score: number;
  space_score: number;
  commute_score: number;
  amenities_score: number;
  quality_score: number;
  delta_rent: number;
  delta_surface: number | null;
  delta_commute_minutes: number | null;
  highlights: { points: string[] } | null;
  recommendation: string | null;
  computed_at: string;
}
