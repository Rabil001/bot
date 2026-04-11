# 🚀 Shapper - Votre Stratège Créatif IA

**Shapper** est une application web moderne conçue pour transformer des idées brutes de startup en concepts structurés, visuels et exploitables. Propulsé par l'intelligence artificielle la plus avancée (Google Gemini), cet outil agit comme votre **Lead Creative Strategist** personnel.

---

## ✨ Fonctionnalités clés

Pour chaque idée soumise, Shapper génère une analyse complète divisée en 5 sections stratégiques :

1.  **🪝 Le Hook (L'Accroche)** : Un résumé percutant en deux phrases capturant l'essence visuelle et le problème fondamental résolu.
2.  **📊 Analyse Stratégique** : Un tableau comparatif évaluant la **Faisabilité**, le **Market Fit** et le score d'**Innovation**.
3.  **🎨 Concept Visuel & Art Direction** : Une palette de couleurs spécifique, un style d'éclairage et un prompt détaillé pour la génération d'images ("Hero Visual").
4.  **😈 L'Avocat du Diable** : Une critique constructive pour identifier le point le plus faible de l'idée et la renforcer.
5.  **🗺️ Roadmap d'Exécution** : Un plan d'action concret en 3 à 5 étapes pour passer de l'idée au MVP (Produit Minimum Viable).

---

## 🛠️ Stack Technique

-   **Framework** : [Next.js 15+](https://nextjs.org/) (App Router & Turbopack)
-   **Intelligence Artificielle** : [Google Gemini API](https://ai.google.dev/) (Modèle Gemini 3 Flash / 1.5 Flash)
-   **Stylisation** : [Tailwind CSS](https://tailwindcss.com/) avec plugin Typography
-   **Rendu Markdown** : Support complet des **tableaux (GFM)** et des **formules mathématiques (LaTeX)** via KaTeX.
-   **Icônes** : Lucide React
-   **Hébergement cible** : Cloudflare Pages

---

## ⚙️ Configuration Locale

### 1. Prérequis
-   Node.js (v20+)
-   Une clé API Google AI Studio (Gemini)

### 2. Installation
```bash
git clone https://github.com/Rabil001/bot.git
cd bot
npm install
```

### 3. Variables d'environnement
Créez un fichier `.env.local` à la racine du projet et ajoutez votre clé :
```env
GEMINI_API_KEY=votre_cle_api_ici
```

### 4. Lancement
```bash
npm run dev
```
L'application sera disponible sur `http://localhost:3000`.

---

## 🚀 Déploiement sur Cloudflare Pages

1.  Connectez votre dépôt GitHub à Cloudflare Pages.
2.  Configurez la commande de build : `npm run build`.
3.  Configurez le répertoire de sortie : `.next`.
4.  **Important** : Ajoutez la variable d'environnement `GEMINI_API_KEY` dans les paramètres de votre projet Cloudflare (Settings > Environment Variables).

---

## 📝 Format de réponse IA

L'outil supporte nativement le formatage riche :
-   **Markdown** pour la structure et les tableaux.
-   **LaTeX** pour les concepts impliquant des mathématiques complexes (ex: `$E=mc^2$`).
-   **Multilingue** : L'IA répond automatiquement dans la langue utilisée par l'utilisateur.

---

*Développé avec ❤️ pour les créateurs et entrepreneurs.*