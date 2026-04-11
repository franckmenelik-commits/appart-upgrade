import { UpgradeScore } from "@/types";

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="transform rotate-90 origin-center"
        fill={color}
        fontSize={size * 0.28}
        fontWeight="bold"
      >
        {score}
      </text>
    </svg>
  );
}

function DeltaBadge({ value, unit, label }: { value: number; unit: string; label: string }) {
  const isPositive = value > 0;
  const color = isPositive ? "text-green-600 bg-green-50" : value < 0 ? "text-red-600 bg-red-50" : "text-gray-500 bg-gray-50";

  return (
    <div className={`rounded-lg px-3 py-2 text-center ${color}`}>
      <div className="text-lg font-semibold">
        {isPositive ? "+" : ""}
        {value}
        {unit}
      </div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  );
}

export default function ScoreCard({ score }: { score: UpgradeScore }) {
  const { listing } = score;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-5">
        <ScoreRing score={score.total_score} />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
          {listing.address && <p className="text-gray-500 text-sm">{listing.address}</p>}

          <div className="flex gap-2 mt-3">
            <DeltaBadge value={score.delta_rent} unit="$" label="loyer" />
            {score.delta_surface != null && (
              <DeltaBadge value={Math.round(score.delta_surface)} unit=" sqft" label="surface" />
            )}
            {score.delta_commute_minutes != null && (
              <DeltaBadge value={-score.delta_commute_minutes} unit=" min" label="trajet" />
            )}
          </div>

          {score.recommendation && (
            <p className="mt-3 text-sm text-gray-700 italic">&ldquo;{score.recommendation}&rdquo;</p>
          )}

          {score.highlights?.points && score.highlights.points.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {score.highlights.points.map((h, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>

        <a
          href={listing.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-blue-500 shrink-0"
        >
          {listing.source}
        </a>
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-5 gap-2 mt-5 pt-4 border-t border-gray-100">
        {[
          { label: "Prix", value: score.price_score },
          { label: "Espace", value: score.space_score },
          { label: "Trajet", value: score.commute_score },
          { label: "Équipements", value: score.amenities_score },
          { label: "Qualité", value: score.quality_score },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-sm font-medium">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
