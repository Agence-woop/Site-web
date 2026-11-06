// Typographie française : espace insécable (U+00A0) devant « ? », « ! », « : » et « ; ».
//
// On remplace seulement une espace ordinaire déjà présente devant le signe (« mot : » devient
// « mot : » avec une insécable). On n'ajoute jamais d'espace là où il n'y en a pas : les heures
// (« 14:30 »), les URL (« https:// ») et les ratios restent intacts.

const NBSP = ' ';
const BEFORE_PUNCT = /(\S) ([?!:;])/g;

/** Applique la règle à une chaîne de texte simple. */
export function frenchSpacing(text) {
  if (typeof text !== 'string' || text.indexOf(' ') === -1) return text;
  return text.replace(BEFORE_PUNCT, `$1${NBSP}$2`);
}

// Éléments dont le texte ne doit jamais être modifié
const SKIP = new Set(['code', 'pre', 'kbd', 'samp', 'script', 'style', 'textarea']);

/**
 * Plugin rehype pour les articles Markdown : applique la règle au texte seulement,
 * jamais aux attributs (href, src, alt…) ni au contenu des éléments de code.
 * Le signe peut être au début d'un nœud de texte (par exemple « <em>mot</em> : »),
 * d'où le suivi du dernier caractère vu dans le nœud précédent.
 */
export function rehypeFrenchSpacing() {
  return (tree) => {
    let prevChar = '';
    const walk = (node) => {
      if (node.type === 'element') {
        if (SKIP.has(node.tagName)) {
          prevChar = 'x';
          return;
        }
        node.children?.forEach(walk);
        return;
      }
      if (node.type === 'text') {
        let value = frenchSpacing(node.value);
        // Espace en tête de nœud, juste après un élément en ligne : « <strong>mot</strong> : »
        if (/^ [?!:;]/.test(value) && prevChar && /\S/.test(prevChar)) {
          value = NBSP + value.slice(1);
        }
        node.value = value;
        if (value.length) prevChar = value[value.length - 1];
        return;
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
