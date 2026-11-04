# Infinity Space · FSBM

Site étudiant bilingue français / arabe, application d’administration séparée et formulaires. Node.js **24+**, SQLite intégré, HTML/CSS/JavaScript natifs. Aucune dépendance npm, aucun framework ni appel de police/CDN. Le site démarre sans installation de paquets.

## Lancer le projet

Ouvrir un terminal **Bash dans le dossier du dépôt** (dans Codespaces, généralement `/workspaces/infinity-space`) :

```bash
node --version
# Si nécessaire et si nvm est installé : nvm install 24 && nvm use 24
read -s -p "Mot de passe admin : " ADMIN_PASSWORD
export ADMIN_PASSWORD
echo
npm start
```

La saisie du mot de passe est invisible. Ne pas le placer dans un fichier suivi par Git, une commande contenant sa valeur ou un message. Sans `ADMIN_PASSWORD`, le site reste consultable et la connexion admin est désactivée.

- **3000** : site public, pages `/`, `/team`, `/activities`, `/activities/:cell` et `/forms/:id`.
- **3001** : application admin indépendante et son aperçu interactif.
- Dans Codespaces : onglet **Ports**, ouvrir le navigateur sur chaque port. Garder les deux ports privés pendant les essais. Le terminal doit rester ouvert ; `Ctrl+C` arrête les serveurs.
- Après une mise à jour : `git pull origin main`, arrêter le serveur avec `Ctrl+C`, relancer `npm start`, puis actualiser le navigateur.

Les variables `PORT`, `ADMIN_PORT`, `DATA_DIR` et `COOKIE_SECURE` sont optionnelles. `DATA_DIR` vaut `data`. Les processus doivent être relancés après restauration d’une machine. Utiliser le checkout existant : chaque tâche cloud est déjà isolée, ne pas créer de worktree sans demande explicite.

## Identité, logos et pied de page

Dans **Identité**, charger le logo du club et le logo officiel de la faculté. Les fichiers joints dans une conversation ne sont pas automatiquement des fichiers du dépôt : aucun logo original n’est inventé ou reconstitué. Sans les originaux, seul le nom du club apparaît et la faculté est identifiée par son nom. Aucun logo de remplacement n’est affiché.

Les logos PNG/JPEG/WebP (10 Mo maximum) sont contenus dans une tuile neutre avec `object-fit: contain` : jamais étirés ni recadrés, y compris un fichier horizontal ou sur fond blanc. Aperçu immédiat sur fond clair et sombre. Le fichier optionnel `public/assets/logo-club-dark.png` ou le champ **Logo pour les fonds sombres** fournit la version sur fond sombre ; sans variante, le logo original est utilisé. Les logos sont agrandis dans l’en-tête, le hero et le pied de page. Le logo événementiel remplace l’original jusqu’à sa date d’expiration ; le retour est calculé à chaque chargement. Le favicon suit le logo chargé. Pour les charger directement dans GitHub : ouvrir `public/assets`, choisir **Add file → Upload files**, puis déposer `logo-club.png` et `logo-fsbm.png` et valider **Commit changes**. Ces vrais fichiers PNG sont détectés automatiquement et ont priorité sur les logos originaux de l’admin. Récupérer ensuite les changements dans Codespaces avec `git pull origin main` et actualiser.

Le pied de page propose une invitation à s’inscrire, quatre colonnes, les informations FSBM en français/arabe, la signature graphique, le changement de langue et le retour en haut. Modifier dans Identité : description FR/AR, Instagram, e-mail, WhatsApp (chiffres avec indicatif), Facebook, adresse FR/AR et lien de carte. Les coordonnées absentes restent masquées. Les liens de navigation possèdent un libellé FR/AR et une destination interne ou HTTPS, modifiables dans Identité.

## Bureau et page Équipe

**Bureau** gère le prénom et le nom FR/AR, le poste FR/AR, l’année du mandat, la photo, la mission / les responsabilités FR/AR, la biographie FR/AR, Instagram/LinkedIn, le groupe FR/AR et les ordres d’affichage. Une seule présidence : le serveur refuse les doublons et l’interface propose de transférer le rôle. Le président est toujours affiché en premier. Les anciens champs `name` sont migrés en prénom/nom sans perdre l’intitulé.

Import de portrait PNG/JPEG/WebP jusqu’à 12 Mo avant traitement, côté maximal 16 000 px. L’outil de recadrage local propose carré ou 4:5, zoom, déplacement au doigt/souris ou flèches du clavier, et recentrage. Il conserve la transparence puis convertit en WebP, qualité 85 %, côté maximal 1 000 px (réduit à 800 px pour les sorties les plus lourdes). Aperçu de la carte FR/AR avant enregistrement. Aucun transfert du fichier original à un service tiers.

Ordre modifiable par glisser-déposer ou flèches accessibles sur téléphone. La page d’accueil présente le président en grand à côté de **8 autres membres maximum**, en **4 colonnes × 2 rangées sur grand écran**. Sur tablette, la grille passe à 2 colonnes ; sur téléphone, le président précède les deux colonnes. Chaque carte place le poste et le vrai logo en haut, puis le nom et l’année sous la photo. `/team` présente **un membre par ligne**, son rôle et sa mission, sans donner plus de valeur à un rôle qu’à un autre. Le texte explique l’égalité entre membres et le renouvellement du bureau pour offrir de nouvelles opportunités. Les portraits partagent un cadre en arche ; les découpes transparentes laissent apparaître le motif, les photos avec fond sont cadrées dans la même forme. Dans **Bureau → Photo de groupe et présentation**, modifier la grande photo collective, sa légende FR/AR, le mandat et les textes sur l’égalité / la rotation des rôles. Les contenus publics suivent la langue sélectionnée ; les noms de la faculté et de l’université ne sont plus affichés dans les deux langues à la fois. Aucun faux membre n’est créé dans la base du club.

## Créateur de formulaires

Édition inline bilingue, ajout / duplication / déplacement / suppression de questions, déplacement entre sections et aperçu du véritable rendu visiteur sur mobile/bureau en FR/AR.

Types : réponse courte, paragraphe, choix unique (avec « Autre »), cases à cocher (avec « Autre »), liste déroulante, échelle 1–5 ou 1–10, grille à choix unique, grille à cases, date, heure et fichier. Chaque question possède un titre FR/AR, une aide FR/AR, un état obligatoire et les paramètres de son type. Les options, lignes, colonnes et libellés de l’échelle sont bilingues. Changer le type conserve le texte et les paramètres précédents.

Validation de texte : longueur, e-mail, téléphone, nombre et bornes, expression régulière simple. Pour éviter les expressions à coût exponentiel, les regex sont limitées à 150 caractères, sans groupes, alternatives ni références arrière, avec une seule répétition variable ; les réponses concernées sont limitées à 1 000 caractères. Utiliser les préréglages pour e-mail et téléphone. Les options peuvent être mélangées, avec ordre stable pendant la saisie.

Sections avec titres/aides FR/AR, progression, précédent/suivant. Les choix uniques et listes peuvent envoyer vers une section suivante ou directement à l’envoi. La première branche applicable de la section détermine la suite ; les boucles et retours vers une section antérieure sont refusés. Seules les questions des sections visitées sont validées et stockées. Réponse personnalisée FR/AR après envoi, et lien facultatif pour répondre à nouveau.

Les paramètres séparent **publié** et **accepter les réponses**. Fermeture automatique par date ou nombre maximum de places. Dates d’administration saisies dans le fuseau du navigateur, stockées en UTC. Le serveur applique la limite dans une transaction SQLite, même en cas d’envois simultanés.

**Autosave :** après 850 ms, le brouillon est stocké séparément dans SQLite, sans modifier le formulaire public. Les brouillons se retrouvent dans la liste et survivent à un redémarrage. Le bouton Enregistrer applique les changements au site selon l’état Publié. Avertissement avant de quitter si des changements ne sont pas encore sauvegardés. Une copie de formulaire démarre privée.

Les anciens types internes `short`, `long`, `choice` et leurs options texte continuent de fonctionner. Le modèle conserve ces identifiants internes. Chaque réponse contient un instantané du formulaire : renommer ou supprimer une question ne supprime pas son ancien libellé. À la première mise à niveau, les anciennes réponses reçoivent un instantané du formulaire encore disponible ; les intitulés déjà supprimés avant cette mise à niveau ne peuvent pas être reconstruits.

## Réponses et statistiques

- Résumé : graphiques SVG avec effectifs/pourcentages pour choix, échelles et grilles, listes pour les autres réponses. Des versions différentes d’une question sont conservées séparément.
- Individuelles : une réponse à la fois avec les intitulés d’origine et fichiers privés.
- Tableau : recherche, tri chronologique et suppression confirmée d’une réponse et de ses fichiers.
- CSV : BOM UTF-8 pour Excel/arabe, échappement des cellules et protection contre les formules, même précédées d’espaces.
- Les réponses des formulaires supprimés restent dans les archives, accessibles depuis Formulaires.
- Dashboard : pages vues et réponses des **7 jours calendaires UTC**, formulaires publiés, histogramme SVG, dernières réponses et accès rapides. Les statistiques comptent des chargements de pages, pas des visiteurs uniques. `/team` est suivi comme les autres pages.

Fichiers de formulaire : PDF, PNG, JPEG, WebP ou texte selon les types autorisés par le bureau, 2 Mo maximum par fichier (le bureau peut choisir moins), requête totale maximale 16 Mo, encodage JSON/base64 compris. Taille, type et signature sont contrôlés. Fichiers conservés sous des noms aléatoires dans `data/uploads`, hors des répertoires publics. Téléchargement en pièce jointe seulement après connexion admin. Pas d’analyse antivirus intégrée : ne pas activer des formats non pris en charge.

## Design system

Changer l’accent en un seul endroit : **`--accent` dans `public/style.css`**. Adapter `--accent-ink` si nécessaire pour conserver le contraste des petits textes. Les deux applications utilisent les mêmes variables.

| Variable | Valeur | Usage |
| --- | --- | --- |
| `--ink` | `#102d36` | Encre, boutons, surfaces foncées |
| `--paper` | `#f6f3ea` | Papier chaud |
| `--accent` | `#dbac50` | Doré du collectif, actions et repères |
| `--accent-ink` | `#78551b` | Accent lisible sur fond clair |
| `--line` | `#d8d8ca` | Filets, tableaux et séparateurs |
| `--space` | `8px` | Unité de base d’espacement (multiples de 4/8) |
| `--radius` | `8px` | Arrondis fonctionnels |
| `--font-display` | Georgia / Noto Naskh Arabic et fontes système | Titres éditoriaux |
| `--font-text` | Segoe UI / Tahoma / Noto Sans Arabic et fontes système | Texte et interface |

Pas de CDN ni de dépendance de police ; les caractères arabes reposent sur les fontes du système. CSS logique pour le RTL, SVG pour les icônes, états de focus visibles, grandes cibles tactiles, animations réduites si `prefers-reduced-motion`. Le partage social utilise une image locale, à remplacer par un visuel officiel du club lorsque fourni. Le serveur résout l’URL absolue de l’image Open Graph à partir du nom d’hôte de la requête.

## Tests et stockage

```bash
npm test
```

Tests d’intégration sans dépendances, avec deux serveurs et une base **temporaire** séparée : authentification/CSRF, migration ancienne base, tous les types, erreurs FR/AR, branches conditionnelles, soumissions simultanées/places, fermeture, snapshots, brouillons, fichiers privés/signatures, statistiques, présidence unique, groupes, limite des cartes, `/team`, pied de page et liens. Les tests ne modifient pas les données du club.

Les données locales `data/` sont ignorées par Git. Sauvegarder `club.sqlite`, `uploads/` **et `media/`** ensemble. Pour une sauvegarde simple, arrêter les processus puis copier le dossier complet, y compris les fichiers SQLite WAL/SHM éventuels. La mise à niveau de schéma est additive et automatique. Les mises à jour concurrentes du site sont détectées par `revision` et renvoient 409 plutôt que d’écraser le travail d’un autre onglet.

## Déploiement

GitHub contient le code ; Codespaces permet de le tester. Aucun de ces deux éléments ne constitue un hébergement permanent du site. Pour publier, prévoir un hébergement Node 24 avec disque persistant, les deux origines distinctes et HTTPS, `COOKIE_SECURE=1`, un mot de passe fort et des sauvegardes. Les sessions expirent après 8 h et sont invalidées au redémarrage ; les tentatives de connexion sont limitées en mémoire. L’admin doit être réservé au bureau. Avant une ouverture publique durable : comptes individuels pour la passation, protection anti-spam des formulaires et politique de conservation des données. Ne pas partager une URL d’administration publique ni un mot de passe dans le dépôt.

La largeur publique utilise `--max: 1680px` (1920px sur très grand écran) et `--gutter` pour réduire les marges latérales. Le téléphone conserve une marge de 22px.

## Images, affiches et activités précédentes

La limite des images administratives est **10 Mo par fichier** (PNG, JPEG, WebP). Chaque image est transférée séparément par l’API admin authentifiée `/api/media`, vérifiée (taille, type et signature), puis stockée sous un nom aléatoire dans `data/media/`. La base conserve son URL, ce qui évite de recopier de grosses images dans tous les brouillons et instantanés. Ces images sont destinées au site public et servies par `/media/:id` sur les deux applications. Les fichiers des réponses aux formulaires restent privés, dans `data/uploads/`, avec leur limite de 2 Mo inchangée. Les anciennes images encodées directement dans SQLite continuent de fonctionner. Les transferts en cours sont attendus avant enregistrement ; en cas d’échec, un message d’erreur s’affiche.

Les en-têtes de formulaire ont un cadre **4:1** de type Google Forms, avec `object-fit: contain`. Ils restent entiers et diminuent proportionnellement sur téléphone. Pour occuper tout le cadre sans marges, préparer une image 1600 × 400 px. Une image d’un autre format est conservée entière dans ce cadre. Sur l’accueil, la carte du formulaire est accompagnée d’un texte explicatif à gauche (disposition miroir en arabe).

Les annonces présentent une affiche entière d’environ **5 cm CSS de hauteur** (environ 189 pixels CSS), ouvrable au clic, au toucher ou au clavier dans une fenêtre agrandie. La fenêtre conserve les proportions et se ferme avec Échap, le bouton Fermer ou un clic à l’extérieur.

**Activités passées** : `/activities` affiche quatre grandes cartes avec pictogrammes pour les cellules **Sports individuels**, **Esport**, **Formations**, **Charity & solidarité**. Les pages `/activities/sport`, `/activities/esport`, `/activities/formations` et `/activities/charity` présentent uniquement leurs propres activités, par date décroissante. Les accès directs, rechargements et statistiques de visite fonctionnent comme les autres pages.

Dans l’admin, ouvrir **Activités passées → Créer une activité** : choisir la cellule et la date, renseigner titre / introduction FR/AR, puis ajouter jusqu’à **30 photos**. Chaque photo possède une courte description FR/AR. Le rendu alterne image à droite / texte à gauche puis l’inverse, avec miroir en arabe et empilement sur téléphone. Un grand titre sépare les activités.

Chaque photo propose un cadre carré, rectangle, portrait ou proportions originales, une hauteur maximale entre 160 et 480 px (**302 px ≈ 8 cm CSS**) et une largeur de 50 à 100 % de sa colonne, avec aperçu immédiat. Le cadre adapte sa taille et montre toute l’image sans recadrage. Les centimètres CSS indiquent une taille de composition, pas une mesure physique garantie sur les écrans. Les photos peuvent aussi s’ouvrir en grand. Modifier, réordonner ou retirer une photo n’efface pas automatiquement le fichier public, afin de préserver les éventuelles autres utilisations de son URL. Prévoir un nettoyage des médias inutilisés dans la politique de conservation.

Le slogan demandé **« Infinity pation in one space »** est conservé tel que fourni ; sa version française/anglaise et sa version arabe sont éditables dans **Identité**.
