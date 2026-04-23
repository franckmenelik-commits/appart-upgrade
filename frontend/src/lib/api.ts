const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Erreur API");
  }
  return res.json();
}

export const api = {
  // Auth
  register: (email: string, name: string, password: string) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ email, name, password }) }),
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: (token: string) =>
    request("/auth/me", { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }),

  // Users
  createUser: (data: { email: string; name: string }) =>
    request("/users/", { method: "POST", body: JSON.stringify(data) }),

  // Baselines
  getBaseline: (userId: string) => request(`/baselines/${userId}`),
  createBaseline: (userId: string, data: Record<string, unknown>) =>
    request(`/baselines/${userId}`, { method: "POST", body: JSON.stringify(data) }),
  updateBaseline: (userId: string, data: Record<string, unknown>) =>
    request(`/baselines/${userId}`, { method: "PUT", body: JSON.stringify(data) }),

  // Listings
  createListing: (data: Record<string, unknown>) =>
    request("/listings/", { method: "POST", body: JSON.stringify(data) }),
  getListings: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/listings/${query}`);
  },
  getListing: (id: string) => request(`/listings/${id}`),

  // Scores (authenticated — pass token)
  scoreListing: (token: string, listingId: string) =>
    request(`/scores/${listingId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    }),
  getUserScores: (token: string, minScore = 0) =>
    request(`/scores/?min_score=${minScore}`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    }),

  // Billing (auth required)
  getPlans: () => request("/billing/plans"),
  createCheckout: (token: string, plan: string) =>
    request(`/billing/checkout/${plan}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    }),
  // Scraping
  triggerCentrisScrape: (params?: { min_price?: number; max_price?: number }) =>
    request(`/scrape/centris${params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : ""}`, { method: "POST" }),
  triggerFullPipeline: () =>
    request("/scrape/pipeline", { method: "POST" }),
};
