import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="max-w-6xl mx-auto px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">V</div>
          <span className="text-sm font-bold tracking-tight">Vivenza</span>
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Conditions Générales d&apos;Utilisation</h1>
        
        <div className="prose prose-blue dark:prose-invert space-y-6 text-[var(--muted)]">
          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">1. Cadre Juridique et Objet</h2>
            <p className="text-sm leading-relaxed">
              Vivenza, opérée par Franck Menelik Afane Eko (&quot;nous&quot;), est une plateforme d&apos;analyse de données immobilières. En accédant au service, vous acceptez les présentes conditions, régies par les lois de la Province de Québec et les lois fédérales du Canada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">2. Absence de Conseil Immobilier</h2>
            <p className="text-sm leading-relaxed text-red-600 font-medium">
              IMPORTANT : Vivenza n&apos;est pas un courtier immobilier, une agence immobilière ou un représentant de la Loi sur le courtage immobilier du Québec. Nos &quot;Scores d&apos;Upgrade&quot; sont des estimations générées par intelligence artificielle à titre informatif uniquement. Toute décision de signer un bail reste la seule responsabilité de l&apos;utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">3. Propriété Intellectuelle (PI)</h2>
            <p className="text-sm leading-relaxed">
              <strong>Contenu de Vivenza :</strong> Le design, le code, les algorithmes de scoring et la marque Vivenza sont la propriété exclusive de Franck Menelik Afane Eko. 
              <br /><br />
              <strong>Algorithmes et IA :</strong> Les scores générés par nos modèles sont protégés au titre du droit d&apos;auteur. Toute extraction massive ou &quot;scraping&quot; de Vivenza par un tiers est strictement interdit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">4. Collecte de données externes</h2>
            <p className="text-sm leading-relaxed">
              Vivenza indexe des informations publiques issues de Centris, Kijiji et Facebook Marketplace. Nous ne sommes ni affiliés, ni parrainés par ces plateformes. Les marques citées appartiennent à leurs propriétaires respectifs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">5. Politique de Remboursement</h2>
            <p className="text-sm leading-relaxed">
              Le forfait Pro ($4.99) est une licence d&apos;utilisation temporaire pour la saison de recherche. Étant donné la nature numérique et instantanée du service, aucun remboursement n&apos;est possible une fois que plus de 3 scores ont été consultés.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
