// Portée CSS de la page qui utilise un composant.
//
// Astro transmet à chaque composant l'attribut de portée (data-astro-cid-…) de la page qui
// l'utilise, sous forme de prop. Le reposer (sans valeur) sur un élément du composant permet aux
// règles scopées de la page de continuer à s'y appliquer, par exemple pour l'espacement d'une
// section, qui dépend du rythme propre à chaque page.

/** Attributs de portée reçus en props, prêts à être reposés sur un élément : { 'data-astro-cid-x': '' }. */
export const parentScope = (props: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(Object.keys(props).filter((k) => k.startsWith('data-astro-cid-')).map((k) => [k, '']));
