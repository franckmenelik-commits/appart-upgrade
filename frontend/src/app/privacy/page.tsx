import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="max-w-6xl mx-auto px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">V</div>
          <span className="text-sm font-bold tracking-tight">Vivenza</span>
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Politique de Confidentialité</h1>
        
        <div className="prose prose-blue dark:prose-invert space-y-6 text-[var(--muted)]">
          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">1. Responsable de la protection des données (Loi 25)</h2>
            <p className="text-sm leading-relaxed">
              Conformément à la Loi sur la protection des renseignements personnels dans le secteur privé (Loi 25), le responsable de la protection des données est <strong>Franck Menelik Afane Eko</strong>. Pour toute question : hello@vivenza.ca.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">2. Données collectées et Finalité</h2>
            <p className="text-sm leading-relaxed">
              Nous collectons : votre courriel (authentification), vos données de &quot;Baseline&quot; (loyer, adresse approximative, critères) et vos interactions avec les annonces. Ces données servent uniquement à générer vos scores d&apos;upgrade et à vous envoyer des alertes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">3. Traitement par Intelligence Artificielle (RGPD)</h2>
            <p className="text-sm leading-relaxed">
              Vivenza utilise les API de Google (Gemini) et Anthropic (Claude) pour l&apos;analyse structurelle des annonces. Vos critères de recherche sont traités par ces serveurs. Nous nous assurons qu&apos;aucune donnée permettant de vous identifier personnellement (Nom, IP, Email) n&apos;est transmise à ces modèles d&apos;IA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">4. Conservation et Suppression</h2>
            <p className="text-sm leading-relaxed">
              Vos données sont conservées tant que votre compte est actif. Conformément au RGPD et à la Loi 25, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression (&quot;Droit à l&apos;oubli&quot;) en nous contactant.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">5. Sécurité des Paiements</h2>
            <p className="text-sm leading-relaxed">
              Les transactions sont cryptées et traitées par Stripe. Vivenza ne stocke aucune coordonnée bancaire sur ses propres serveurs.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
