// Petits utilitaires de rendu HTML pour les composants.

/**
 * Texte brut prêt à être écrit avec set:html, au caractère près comme un texte tapé dans un
 * gabarit Astro : seuls &, < et > sont échappés. Les apostrophes et guillemets restent tels
 * quels (une expression {texte} les écrirait &#39; et &quot;, ce qui changerait le HTML).
 */
export const text = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
