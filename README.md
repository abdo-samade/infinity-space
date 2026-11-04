# Infinity Space · FSBM

Première version fonctionnelle, sans dépendances externes. Node.js 24 minimum (SQLite intégré).

## Démarrage

Depuis `/workspace/infinity-space`, fournir `ADMIN_PASSWORD` dans l’environnement puis lancer `npm start`. Aucun mot de passe par défaut. Le site public écoute sur le port 3000 ; l’application admin séparée écoute sur 3001. Les ports peuvent être configurés par `PORT` et `ADMIN_PORT`. Les deux applications communiquent avec la même base SQLite persistante `data/club.sqlite` ; sauvegarder ce fichier. Les processus doivent être relancés après restauration d’une machine.

L’admin propose les formulaires (questions courtes, longues, choix unique, champs obligatoires, image d’en-tête), brouillons/publication, réponses/CSV, annonces, bureau, logos et logo temporaire avec date d’expiration. Les visiteurs peuvent remplir les formulaires sur leur page dédiée. Le site est français/arabe avec RTL. Les statistiques sont des chargements de pages, non des visiteurs uniques ; les réponses hebdomadaires et visites sur 7 jours sont réelles.

## Avant une mise en ligne

Déployer les applications sur deux origines distinctes avec HTTPS, définir `COOKIE_SECURE=1`, un mot de passe fort et une protection anti-bruteforce au reverse proxy. Le port admin doit rester accessible au bureau uniquement. Ne pas exposer directement cette première version sur Internet : ajouter des comptes individuels et rôles pour la passation, limitation de débit et anti-spam avant publication. Les sessions sont en mémoire et expirent après 8 h. Les images (PNG/JPG/WebP, 1 Mo) sont stockées dans le contenu SQLite. Les logos joints à la conversation n’étant pas disponibles sur disque, les charger dans Identité visuelle ; le site utilise provisoirement un symbole infini typographique. Aucune annonce ni identité de membre fictive n’est publiée.

Les formulaires ne proposent pas encore de logique conditionnelle, modification après soumission, limite de places ou upload de pièces jointes. Les traductions du contenu sont saisies par le bureau, avec repli sur le français. Utiliser des questions bilingues pour les options de choix. Pour un nouveau schéma de questions après des réponses, créer un nouveau formulaire afin de conserver la lecture des réponses historiques.

## Vérification

`npm test` exécute le test d’intégration dans un dossier temporaire, sur deux ports distincts. Il vérifie les accès admin, la publication, les champs obligatoires, les réponses et statistiques.
