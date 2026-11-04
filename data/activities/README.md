# Une cellule, un fichier de contenu

- `sport.js` → `/activities/sport`
- `esport.js` → `/activities/esport`
- `formations.js` → `/activities/formations`
- `charity.js` → `/activities/charity`

**Au premier démarrage**, le serveur copie automatiquement les activités existantes de votre SQLite dans le bon fichier. Les URL des photos, leur ordre et les descriptions sont conservés. Le tournoi d’échecs reçoit par défaut les trois titres **Les échiquiers / L’analyse / Le partage** si ces titres n’étaient pas encore renseignés. Le modèle `draft` de `sport.js` est un exemple non publié ; vos vrais articles sont dans `articles` après migration.

Le manager et ces fichiers restent synchronisés : enregistrer une activité dans l’admin met à jour son fichier. Modifier un fichier puis actualiser le site suffit ; aucun composant ni redémarrage à modifier. Si le manager était ouvert avant votre modification, rechargez-le avant d’enregistrer ; une sauvegarde périmée est refusée pour protéger le fichier.

## Format conseillé, plusieurs activités

```js
export default {
  cell: "sport",
  legacyMigrated: true,
  doodles: ["pawn", "checkers", "pingpong", "tennis", "card"],
  articles: [
    {
      id: "tournoi-echecs",
      date: "2026-11-04",
      title: "Tournoi d’échecs — Une journée de stratégie et de partage",
      titleAr: "بطولة الشطرنج — يوم من الاستراتيجية والمشاركة",
      accentWord: "stratégie",
      accentWordAr: "الاستراتيجية",
      intro: "Une journée de concentration, de stratégie et de convivialité.",
      introAr: "يوم من التركيز والاستراتيجية والألفة.",
      keywords: ["concentration", "stratégie", "convivialité"],
      keywordsAr: ["التركيز", "الاستراتيجية", "الألفة"],
      sections: [
        {
          title: "Les échiquiers",
          titleAr: "رقع الشطرنج",
          text: "Votre description de cette première photo.",
          textAr: "وصف الصورة الأولى.",
          image: "/img/activities/sport/01.jpg"
        },
        {
          title: "L’analyse",
          titleAr: "التحليل",
          text: "Votre deuxième description.",
          textAr: "وصف الصورة الثانية.",
          image: "/img/activities/sport/02.jpg"
        }
      ]
    }
  ]
};
```

Un seul article peut aussi utiliser directement `export default { date, title, ... sections }` comme dans le brief. `id` est alors calculé si absent. La date ISO est recommandée ; une date française comme `4 novembre 2026` est également acceptée.

Pour ajouter une section, ajouter un objet dans `sections`. La numérotation et l’alternance sont automatiques, sans limite de 3 sections. Pour ajouter une activité, ajouter un objet dans `articles`. Les activités sont triées par date décroissante.

Les images importées dans le manager conservent leurs URL `/media/...` : ne pas les remplacer pour la migration. Pour des images dans Git, placer les fichiers dans `public/img/activities/<cellule>/` et utiliser le chemin `/img/activities/<cellule>/nom.jpg`. Ne pas mettre une adresse locale d’ordinateur dans `image`.

## Motifs SVG disponibles

`pawn`, `checkers`, `pingpong`, `tennis`, `card`, `game`, `code`, `headset`, `trophy`, `bolt`, `book`, `bulb`, `brush`, `camera`, `micro`, `heart`, `hands`, `leaf`, `people`, `sun`.

La liste `doodles` à la racine du fichier contrôle les motifs de cette cellule. Ils sont générés au chargement et utilisent uniquement les couleurs existantes du thème.

## Conservation des données

Ces fichiers contiennent du **contenu public** et peuvent être sauvegardés dans Git. Ils ne contiennent aucune réponse privée aux formulaires. Les images `/media/...` restent sur le disque du serveur : sauvegarder aussi `data/media/` avec SQLite et `data/uploads/`. Ne pas remplacer un fichier rempli par le modèle vide d’une nouvelle installation. Les modifications faites dans le manager peuvent apparaître comme changements locaux dans Git : c’est normal.
