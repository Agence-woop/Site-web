// Source unique des 5 pages Services : menu « Services » de l'en-tête, rubrique « Services » du
// pied de page et cycle « L'écosystème » (composant ServiceCycle).
//
// Ordre de la liste = ordre du menu et du pied de page.
// Une page est « en ligne » dès que son `href` est défini : elle apparaît alors dans le menu et
// le pied de page, et sa carte du cycle devient un lien. Pour publier une nouvelle page Services,
// il suffit donc d'ajouter son `href` (et, si on le souhaite, son libellé court `hint`).

export type ServiceKey = 'marque' | 'reseaux' | 'publicite' | 'sites' | 'experience';

export interface Service {
  key: ServiceKey;
  /** Nom du service (menu, pied de page, carte du cycle) */
  label: string;
  /** Rôle dans le cycle (« Amène », « Fait réserver »…), sous le nom dans la carte du cycle */
  role: string;
  /** Libellé court sous le nom, dans le menu déroulant de l'en-tête (facultatif) */
  hint?: string;
  /** Adresse de la page, sans le préfixe base ; absente tant que la page n'est pas en ligne */
  href?: string;
}

export const SERVICES: Service[] = [
  { key: 'marque', label: 'Image de marque', role: 'La fondation' },
  { key: 'reseaux', label: 'Réseaux sociaux', role: 'Fait connaître' },
  {
    key: 'publicite',
    label: 'Publicité Google et Meta',
    role: 'Amène',
    hint: 'Amène le patient',
    href: '/publicite-google-meta/',
  },
  { key: 'sites', label: 'Sites web', role: 'Fait réserver' },
  { key: 'experience', label: 'Expérience client', role: 'Fait revenir et recommander' },
];

/** Pages Services déjà en ligne, dans l'ordre du menu. */
export const liveServices = (): (Service & { href: string })[] =>
  SERVICES.filter((s): s is Service & { href: string } => Boolean(s.href));

/** Service par clé. */
export const service = (key: ServiceKey): Service => SERVICES.find((s) => s.key === key)!;

/**
 * Ordre du cycle d'un patient : il vous découvre (réseaux), il cherche (publicité), il réserve
 * (site), il revient et recommande (expérience), puis les avis relancent le cycle.
 * L'image de marque est au centre : elle nourrit chaque étape.
 */
export const CYCLE: ServiceKey[] = ['reseaux', 'publicite', 'sites', 'experience'];
export const CYCLE_CORE: ServiceKey = 'marque';
