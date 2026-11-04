# Logos officiels à ajouter ici

Déposer les vrais fichiers PNG avec exactement ces noms :

- `logo-club.png` : logo officiel Infinity Space.
- `logo-fsbm.png` : logo officiel de la faculté.
- `logo-club-dark.png` (optionnel) : version du logo à utiliser sur les fonds sombres. La nouvelle variante peut aussi être chargée dans **Identité → Logo pour les fonds sombres**.

GitHub → dossier `public/assets` → **Add file → Upload files** → déposer les deux images → **Commit changes** sur `main`.

Le serveur détecte ces fichiers automatiquement : aucune modification de code ou de base de données n’est nécessaire. Dans Codespaces, récupérer les fichiers avec `git pull origin main` puis actualiser le navigateur. Les fichiers officiels du dépôt ont priorité sur le logo original enregistré dans l’admin. Un logo événementiel avec une date d’expiration reste possible depuis l’admin.

Les images sont affichées entières sans recadrage, dans l’en-tête, la grande zone d’identité et le pied de page pour le club, et dans le bloc faculté pour la FSBM. Sans fichier ni logo chargé dans l’administration, seul le nom du club apparaît : aucun logo de remplacement n’est généré.

Le site n’ajoute aucun fond, contour ni cadre aux logos. Pour la version sombre demandée, utiliser exactement **`logo-club-dark.png`** dans ce dossier. Fournir un vrai PNG transparent si vous souhaitez éviter un fond déjà présent dans le fichier. Le logo clair reste **`logo-club.png`**.
