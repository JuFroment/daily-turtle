# Quête du quotidien

Petite application web mobile-first en HTML, CSS et JavaScript.

## Ce qu'elle fait

- Quêtes quotidiennes personnalisables
- Points d'expérience, niveaux et rangs
- Vue des sept derniers jours
- Note d'initiative quotidienne
- Bilan hebdomadaire
- Export JSON
- Sauvegarde locale dans le navigateur
- Installation possible comme PWA
- Fonctionnement hors ligne après la première ouverture

## Lancer sur un ordinateur

Le service worker d'une PWA ne fonctionne pas correctement en ouvrant simplement `index.html` en `file://`.
Il faut lancer un petit serveur local.

Avec Python :

```bash
cd julien_rpg_tracker
python -m http.server 8000
```

Puis ouvrir :

```text
http://localhost:8000
```

## Tester sur le téléphone

Le téléphone et l'ordinateur doivent être sur le même réseau Wi-Fi.

1. Sur le PC, trouver son adresse IP locale avec `ipconfig`.
2. Lancer :

```bash
python -m http.server 8000 --bind 0.0.0.0
```

3. Sur le téléphone, ouvrir :

```text
http://ADRESSE_IP_DU_PC:8000
```

Exemple : `http://192.168.1.25:8000`

Pour une installation durable sur Android, le plus simple sera ensuite de publier gratuitement le dossier sur GitHub Pages, Netlify ou Cloudflare Pages. Une PWA installable demande normalement HTTPS, sauf sur `localhost`.

## PWA, simplement

Une PWA est un site web qui peut se comporter presque comme une application :
- icône sur l'écran d'accueil ;
- ouverture sans barre de navigateur ;
- fonctionnement hors ligne ;
- pas besoin de passer par le Play Store.

Les fichiers `manifest.json` et `sw.js` ajoutent ces capacités.
