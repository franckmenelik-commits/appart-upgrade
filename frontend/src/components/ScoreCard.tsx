import { UpgradeScore } from "@/types";

function ScoreBadge({ score }: { score: number }) {
  const bg = score >= 70 ? "bg-green-600" : score >= 40 ? "bg-yellow-600" : "bg-red-600";
  return (
    <div className={`${bg} w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white/30`}>
      {score}
    </div>
  );
}

function DeltaChip({ value, unit, label }: { value: number; unit: string; label: string }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const colorClasses = isNeutral
    ? "text-gray-500 bg-gray-100"
    : isPositive
      ? label === "loyer"
        ? "text-red-600 bg-red-50"
        : "text-green-600 bg-green-50"
      : label === "loyer"
        ? "text-green-600 bg-green-50"
        : "text-red-600 bg-red-50";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${colorClasses}`}>
      {isPositive ? "+" : ""}{value}{unit}
      <span className="ml-1 opacity-60">{label}</span>
    </span>
  );
}

export default function ScoreCard({ score }: { score: UpgradeScore }) {
  const { listing } = score;
  const imageUrl = listing.image_urls?.[0];

  return (
    <div className="group rounded-xl overflow-hidden border border-[var(--card-border)] bg-[var(--card)] shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Image with score overlay */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover img-zoom"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}

        {/* Score overlay */}
        <div className="absolute top-3 left-3">
          <ScoreBadge score={score.total_score} />
        </div>

        {/* Source badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
            {listing.source}
          </span>
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Price on image */}
        {listing.rent_monthly && (
          <div className="absolute bottom-3 left-3 text-white font-bold text-lg">
            {listing.rent_monthly.toLocaleString()}$/mois
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[var(--foreground)] truncate">{listing.title}</h3>
        {listing.address && (
          <p className="text-sm text-[var(--muted)] mt-0.5 truncate">{listing.address}</p>
        )}

        {/* Delta chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <DeltaChip value={score.delta_rent} unit="$" label="loyer" />
          {score.delta_surface != null && (
            <DeltaChip value={Math.round(score.delta_surface)} unit=" sqft" label="surface" />
          )}
          {score.delta_commute_minutes != null && (
            <DeltaChip value={-score.delta_commute_minutes} unit=" min" label="trajet" />
          )}
        </div>

        {/* Recommendation */}
        {score.recommendation && (
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed line-clamp-2">
            {score.recommendation}
          </p>
        )}

        {/* Highlight tags */}
        {score.highlights?.points && score.highlights.points.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {score.highlights.points.map((h, i) => (
              <span key={i} className="bg-blue-50 dark:bg-blue-950 text-blue-600 text-xs px-2 py-0.5 rounded-md">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Sub-scores bar */}
        <div className="grid grid-cols-5 gap-1 mt-4 pt-3 border-t border-[var(--card-border)]">
          {[
            { label: "Prix", value: score.price_score },
            { label: "Espace", value: score.space_score },
            { label: "Trajet", value: score.commute_score },
            { label: "Equip.", value: score.amenities_score },
            { label: "Qualite", value: score.quality_score },
          ].map(({ label, value }) => {
            const barColor = value >= 70 ? "bg-green-500" : value >= 40 ? "bg-yellow-500" : "bg-red-500";
            return (
              <div key={label} className="text-center">
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mb-1">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
                </div>
                <div className="text-[10px] text-[var(--muted)]">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Link to original */}
      <a
        href={listing.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-4 py-2.5 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 border-t border-[var(--card-border)] transition-colors"
      >
        Voir l&apos;annonce originale
      </a>
    </div>
  );
}
