// Source unique de l'équipe : noms, photos, cadrages, liens et rôles selon le contexte.
// Utilisée par l'accueil, Santé, RH, Équipe (photos, JSON-LD) et, via authors.ts, par le blog.
// Les rôles sont volontairement différents d'un contexte à l'autre : ne pas les harmoniser
// sans le vouloir, ils sont affichés tels quels.

export type MemberKey = 'gauthier' | 'kevin' | 'emma' | 'ludo';

/**
 * Cadrage d'une photo ronde.
 * - fx / fy : cadrage d'origine (photo calée en haut, agrandie autour de ce point).
 * - objectPosition / zoom : cadrage propre à une photo. Dès que l'un des deux est défini, il
 *   remplace le cadrage d'origine : la photo est positionnée sur ce point (object-position,
 *   « center » par défaut) puis agrandie autour de lui (facteur d'échelle, 1 par défaut).
 */
export interface RoundFraming {
  fx?: string;
  fy?: string;
  objectPosition?: string;
  zoom?: number;
}

export interface TeamMember {
  key: MemberKey;
  firstName: string;
  fullName: string;
  /** Nom du fichier dans /public/images, sans extension (.webp) */
  img: string;
  /** Dimensions réelles du fichier */
  width: number;
  height: number;
  /** Cadrage des photos rondes (vignettes, bandeau final, barre collante, schéma de l'Équipe) */
  round: RoundFraming;
  /** Cadrage de la photo verticale de la fiche de la page Équipe (object-position) */
  cardPhotoPos: string;
  linkedin?: string;
  /** Lien de contact (sans le préfixe base) */
  contact?: string;
  /** Ancre de la personne dans le JSON-LD de la page Équipe (#…) */
  ldId: string;
  roles: {
    /** Vignettes de l'accueil (« Les visages de votre équipe ») */
    home: string;
    /** Fiche du carrousel de la page Équipe */
    card: string;
    /** JSON-LD de la page Équipe (Person.jobTitle) */
    jobTitle: string;
    /** Signature des articles du blog (authors.ts) */
    author?: string;
  };
  /** Courte bio de la signature des articles du blog (authors.ts) */
  authorBio?: string;
}

export const team: Record<MemberKey, TeamMember> = {
  gauthier: {
    key: 'gauthier',
    firstName: 'Gauthier',
    fullName: 'Gauthier Figueres',
    img: 'gauthier',
    width: 671,
    height: 822,
    // Aligné sur Kevin (ligne des yeux, haut de la tête, taille du visage).
    round: { objectPosition: '57.8% 30.6%', zoom: 1.7 },
    cardPhotoPos: '50% 35%',
    linkedin: 'https://www.linkedin.com/in/gauthier-f-00561b203/',
    contact: '/contact/?personne=gauthier',
    ldId: 'gauthier-figueres',
    roles: {
      home: 'Cofondateur · Stratégie · Infirmier clinicien',
      card: 'Cofondateur · Stratégie',
      jobTitle: 'Cofondateur, stratégie',
      author: 'Cofondateur, stratégie et comptes Santé',
    },
    authorBio: "Infirmier clinicien de formation, ancien directeur de clinique privée, il pilote chez WOOP la stratégie et les comptes Santé.",
  },
  kevin: {
    key: 'kevin',
    firstName: 'Kevin',
    fullName: 'Kevin Zounias',
    img: 'kevin',
    width: 671,
    height: 822,
    round: { fx: '50%', fy: '31%' },
    cardPhotoPos: '50% 30%',
    linkedin: 'https://www.linkedin.com/in/k%C3%A9vin-zounias/',
    contact: '/contact/?personne=kevin',
    ldId: 'kevin-zounias',
    roles: {
      home: 'Cofondateur · Création',
      card: 'Cofondateur · Création',
      jobTitle: 'Cofondateur, création',
      author: 'Cofondateur, création',
    },
    authorBio: "Designer graphique de formation, il pilote l'identité de marque de chaque projet et accompagne les comptes Recrutement.",
  },
  emma: {
    key: 'emma',
    firstName: 'Emma',
    fullName: 'Emma Despujols',
    img: 'emma',
    width: 671,
    height: 822,
    round: { fx: '55%', fy: '31%' },
    cardPhotoPos: '50% 30%',
    linkedin: 'https://www.linkedin.com/in/emma-despujols-161235211/',
    contact: '/contact/?personne=emma',
    ldId: 'emma-despujols',
    roles: {
      home: 'Spécialiste Paid Media',
      card: 'Spécialiste Paid Media',
      jobTitle: 'Spécialiste Paid Media',
      author: 'Spécialiste Paid Media',
    },
    authorBio: 'Elle pilote la performance publicitaire sur Google Ads et Meta Ads et conçoit les pages de conversion.',
  },
  ludo: {
    key: 'ludo',
    firstName: 'Ludo',
    fullName: 'Ludo Santos',
    img: 'ludo',
    // Photo plus large (même format) où le visage est plus petit : cadrage réglé pour aligner
    // la ligne des yeux et la taille du visage sur Kevin.
    width: 928,
    height: 1137,
    round: { objectPosition: '50.4% 21.7%', zoom: 1.9 },
    cardPhotoPos: '50% 30%',
    ldId: 'ludo-santos',
    roles: {
      home: 'Développeur web',
      card: 'Développeur web',
      jobTitle: 'Développeur web',
    },
  },
};

/** Ordre des grilles : vignettes de l'accueil, schéma et carrousel de l'Équipe. */
export const ORDER_GRID: MemberKey[] = ['gauthier', 'kevin', 'emma', 'ludo'];

/**
 * Ordre des rangées de photos qui se chevauchent (bandeau final, barre collante) : chaque photo
 * passe au-dessus de celle de gauche (ordre du HTML), donc Emma, en dernier, est entièrement visible.
 */
export const ORDER_STACK: MemberKey[] = ['gauthier', 'kevin', 'ludo', 'emma'];

/** Membres dans un ordre donné. */
export const membersIn = (order: MemberKey[]): TeamMember[] => order.map((k) => team[k]);

/** Chemin de la photo (sans le préfixe base). */
export const photoPath = (m: TeamMember): string => `/images/${m.img}.webp`;

/** La photo a-t-elle un cadrage propre (objectPosition / zoom) ? */
export const isFramed = (f: RoundFraming): boolean => f.objectPosition !== undefined || f.zoom !== undefined;

/** Variables CSS de cadrage d'une photo ronde (attribut style). */
export const framingStyle = (f: RoundFraming): string =>
  isFramed(f)
    ? `--obj-pos: ${f.objectPosition ?? 'center'}; --zoom: ${f.zoom ?? 1};`
    : `--fx: ${f.fx ?? '50%'}; --fy: ${f.fy ?? '30%'};`;
