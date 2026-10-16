# The Pearl of Africa — site vitrine

Site statique (HTML/CSS/JS), sans compilation. Prêt pour Vercel.
91 fichiers au total : moins de 100, donc envoyable en une seule fois par le site GitHub.

## Structure

- `index.html` : la page
- `assets/config.js` : **toutes les coordonnées** (adresse, téléphones, horaires, e-mail, réseaux). C'est le seul fichier à modifier pour les mettre à jour.
- `assets/styles.css`, `assets/app.js` : design et effets de défilement
- `media/storefront.webp` : photo réelle de la façade (fournie)
- `media/frames/` : 80 images extraites de la vidéo de visite fournie, synchronisées avec le défilement (40 seulement sur téléphone)
- `media/emblem.webp`, `favicon.png`, `apple-touch-icon.png` : emblème recadré depuis l'enseigne

## Images d'ambiance de l'Ouganda (section « Uganda, the Pearl of Africa »)

Photos gratuites (licence Unsplash), toutes prises en Ouganda, sans personnes, chargées depuis le CDN d'Unsplash :
- cascade et arc-en-ciel : Jonathan Göhner — unsplash.com/photos/dB9uhIxlHyE
- collines vues du ciel : Random Institute — unsplash.com/photos/KQ5djKAN35s
- champs de thé, Fort Portal : Michael Starkie — unsplash.com/photos/hDPqTAC-QJg
- fruits sur l'arbre, Kampala : Michael Starkie — unsplash.com/photos/_3ZHkg5Tcv0
- manguier, Ibanda : Kia Sheikhy — unsplash.com/photos/pulQuoU0t38
- campagne de Fort Portal : Itote Rubombora — unsplash.com/photos/8PF8fl6e6yE
- vallée boisée : Julie Ricard — unsplash.com/photos/pPkrf7-iYVo

Ce sont des images d'ambiance de l'Ouganda : elles ne montrent ni la boutique ni ses produits, et le site l'indique.

## Section « The staples of a Ugandan kitchen »

Photos d'illustration (licence Unsplash), sans personnes ni marques :
- Matoke : Daniele Franchi — unsplash.com/photos/twUR4Ajnhfk
- Cassava : Sara Gomes — unsplash.com/photos/0psoaGSZs-4
- G-nuts : Mustafa Akın — unsplash.com/photos/mNSvtSMYU18
- Beans : Shelley Pauls — unsplash.com/photos/t4X660oKiYs

Le site précise qu'il s'agit d'illustrations et invite à appeler pour connaître l'arrivage de la semaine. Si la boutique fournit ses propres photos de ces produits, il suffit de remplacer les adresses des images dans `index.html`.
Citation : Winston Churchill, *My African Journey* (1908), qui a popularisé le surnom « la Perle de l'Afrique ».

## Effets

- Préchargeur avec pourcentage, puis lever de rideau (idée reprise du kit ScrollVideo)
- Parallaxe à la souris sur la visite (ordinateur uniquement, idée du kit ScrollVideo)
- Visite photo → vidéo synchronisée au défilement
- Mosaïque en zoom parallaxe (inspirée du composant « Zoom Parallax » trouvé sur 21st.dev)
- Texte révélé mot par mot, cartes empilées, bandeau défilant, final lettre par lettre
- Tout est désactivé si l'appareil demande moins d'animations

## Sources des informations

Toutes les coordonnées viennent du flyer et du menu d'Oryx Village (même groupe), et de la photo de la façade :
- adresse : Naif Rd, Deira, Dubai, en face de la mosquée Al Futtaim, près du Venom Club (DJ Ram)
- téléphones : +971 52 212 6655 (indiqué « The Pearl of Africa Grocery » sur le flyer, WhatsApp), +971 58 193 4455 (WhatsApp), +971 50 404 8709
- arrivage hebdomadaire de produits frais d'Ouganda : texte en luganda du flyer

## À compléter (non trouvé dans les sources, donc non affiché)

Dans `assets/config.js` :
- `slogan` : aucun slogan n'apparaît dans les sources Oryx Village
- `hours` : horaires d'ouverture (le site invite à appeler en attendant)
- `email`, `socials` : aucun e-mail ni réseau social confirmé
- itinéraire : Google Maps n'a pas de fiche vérifiée pour la boutique ; l'itinéraire mène à la mosquée Al Futtaim, en face. Remplacer `mapsQuery` par le lien ou le nom de la fiche Google de la boutique quand elle existe.

## Médias à fournir pour aller plus loin

- La vidéo de visite fournie couvre la façade → entrée → comptoir. Pour montrer d'autres espaces (rayon frais, fond de boutique…), il faut une vidéo ou des photos réelles de ces espaces.
- Confirmer que la vidéo de visite correspond bien à l'intérieur réel de la boutique.

## Envoyer sur GitHub par le site (sans Git)

Les dossiers `assets/` et `media/` sont indispensables : sans eux, la page s'affiche sans design.

1. Sur GitHub, ouvrir le dépôt, puis **Add file > Upload files**.
2. Ouvrir ce dossier dans l'Explorateur Windows, faire **Ctrl + A** pour tout sélectionner (dossiers compris), puis **glisser-déposer** la sélection sur la page GitHub. Utiliser Chrome ou Edge.
   Ne pas utiliser « choose your files » : cette fenêtre ne permet pas d'envoyer des dossiers.
3. Attendre la fin du chargement (91 fichiers), puis **Commit changes**.
4. Vérifier sur GitHub que `assets/` et `media/` apparaissent bien à la racine du dépôt, à côté de `index.html`.

Pour un dépôt existant déjà rempli, le même glisser-déposer ajoute les fichiers manquants et remplace les anciens.

## Déployer sur Vercel

1. Sur vercel.com : **Add New… > Project**, importer le dépôt GitHub, Framework Preset **Other**, **Deploy**.
   Un dépôt déjà relié à Vercel se republie tout seul après chaque envoi sur GitHub.
2. Ou, sans GitHub : `npx vercel --prod` depuis ce dossier (Node.js requis).
