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
  /** Rôle dans le cycle (« Fait venir », « Fait réserver »…), sous le nom dans la carte du cycle
      (distinct du libellé court du menu, `hint`) */
  role: string;
  /** Libellé court sous le nom, dans le menu déroulant de l'en-tête (facultatif) */
  hint?: string;
  /** Adresse de la page, sans le préfixe base ; absente tant que la page n'est pas en ligne */
  href?: string;
  /** Icône au trait (contenu d'un SVG 24 × 24, trait 1,8) : cartes du cycle (ServiceCycle) */
  icon: string;
}

// Icônes reprises de la grille « Nos services » de l'accueil (mégaphone, bulle avec un cœur,
// fenêtre de navigateur, Instagram) et de la tuile « Image de marque clinique » de la page
// Santé (palette de peintre).
const ICONS = {
  palette:
    '<path d="M12 3a9 9 0 000 18c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 005-5c0-4-4-7.2-9-7.2z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/><circle cx="17.2" cy="11" r="1"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
  megaphone: '<path d="M4 13v-2a1 1 0 011-1h3l7-4v14l-7-4H5a1 1 0 01-1-1z"/><path d="M8 16l1.5 4.5"/><path d="M19 9.5a4 4 0 010 5"/>',
  browser: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M3 8h18"/><path d="M12 12l6 2.5-2.6 1-1 2.6z"/>',
  heartBubble: '<path d="M20 12a8 8 0 01-11.6 7.1L4 20l1-4.2A8 8 0 1120 12z"/><path d="M12 15.5s-3.5-2-3.5-4.3a2 2 0 013.5-1.3 2 2 0 013.5 1.3c0 2.3-3.5 4.3-3.5 4.3z"/>',
};

/** SVG complet d'une icône de service, au style des icônes du site. */
export const serviceIconSvg = (s: Service): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s.icon}</svg>`;

export const SERVICES: Service[] = [
  {
    key: 'marque',
    label: 'Image de marque',
    role: 'La fondation de tout le reste',
    hint: 'La fondation de tout le reste',
    href: '/image-de-marque/',
    icon: ICONS.palette,
  },
  {
    key: 'reseaux',
    label: 'Gestion des réseaux sociaux',
    role: 'Fait connaître',
    hint: 'Fait connaître',
    href: '/gestion-reseaux-sociaux/',
    icon: ICONS.instagram,
  },
  {
    key: 'publicite',
    label: 'Publicité Google et Meta',
    role: 'Fait venir',
    hint: 'Fait venir',
    href: '/publicite-google-meta/',
    icon: ICONS.megaphone,
  },
  { key: 'sites', label: 'Sites web', role: 'Fait réserver', icon: ICONS.browser },
  { key: 'experience', label: 'Expérience client', role: 'Fait revenir et recommander', icon: ICONS.heartBubble },
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
