import { UpgradeScore } from "@/types";
import Link from "next/link";

function ScoreBadge({ score }: { score: number }) {
  const bg = score >= 70 ? "bg-green-600 shadow-green-100" : score >= 40 ? "bg-yellow-500 shadow-yellow-100" : "bg-red-500 shadow-red-100";
  return (
    <div className={`${bg} w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl ring-4 ring-white/10 backdrop-blur-md`}>
      <div className="text-[10px] font-black opacity-60 uppercase leading-none mb-0.5">Score</div>
      <div className="text-lg font-black leading-none">{score}</div>
    </div>
  );
}

function DeltaChip({ value, unit, label, icon }: { value: number; unit: string; label: string; icon?: string }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const isGood = label === "loyer" ? !isPositive : isPositive;
  
  const colorClasses = isNeutral
    ? "text-gray-500 bg-gray-50"
    : isGood
      ? "text-green-600 bg-green-50/50 border-green-100"
      : "text-red-600 bg-red-50/50 border-red-100";

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-tight ${colorClasses}`}>
      {icon && <span>{icon}</span>}
      {isPositive ? "+" : ""}{value}{unit}
      <span className="opacity-50">{label}</span>
    </span>
  );
}

export default function ScoreCard({ score }: { score: UpgradeScore }) {
  const { listing } = score;
  const imageUrl = listing.image_urls?.[0];

  return (
    <div className="group rounded-2xl overflow-hidden border border-[var(--card-border)] bg-white dark:bg-[#141413] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <span className="text-4xl opacity-20">🏠</span>
          </div>
        )}

        <div className="absolute top-4 left-4 z-10">
          <ScoreBadge score={score.total_score} />
        </div>

        <div className="absolute top-4 right-4 z-10">
          <span className="bg-black/80 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md">
            {listing.source}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {listing.rent_monthly && (
          <div className="absolute bottom-4 left-4 text-white">
            <div className="text-xs font-bold opacity-70 uppercase tracking-widest mb-0.5">Loyer estimé</div>
            <div className="text-2xl font-black">{listing.rent_monthly.toLocaleString()}$<span className="text-sm font-normal opacity-60">/mois</span></div>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-sm text-[var(--foreground)] truncate mb-1">{listing.title}</h3>
        {listing.address && (
          <div className="flex items-center gap-1.5 text-[var(--muted)] text-xs mb-4">
            <span className="opacity-50">📍</span>
            <span className="truncate">{listing.address}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          <DeltaChip value={score.delta_rent} unit="$" label="loyer" icon="💰" />
          {score.delta_surface != null && (
            <DeltaChip value={Math.round(score.delta_surface)} unit="ft²" label="espace" icon="📐" />
          )}
          {score.delta_commute_minutes != null && (
            <DeltaChip value={Math.round(-score.delta_commute_minutes)} unit="m" label="trajet" icon="⚡" />
          )}
        </div>

        <div className="space-y-3 mb-6">
          {[
            { label: "💰 Prix", value: score.price_score },
            { label: "📐 Espace", value: score.space_score },
            { label: "⚡ Trajet", value: score.commute_score },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter opacity-70">
                <span>{label}</span>
                <span>{value}%</span>
              </div>
              <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${value >= 70 ? "bg-green-500" : value >= 40 ? "bg-yellow-500" : "bg-red-500"}`} 
                  style={{ width: `${value}%` }} 
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[var(--surface)] text-[var(--foreground)] py-3 rounded-xl text-center text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            Annonce Source
          </a>
          <Link 
            href={`/dashboard/${score.id}`}
            className="w-12 h-11 bg-blue-600 text-white flex items-center justify-center rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
          >
            →
          </Link>
        </div>
      </div>
    </div>
  );
}
