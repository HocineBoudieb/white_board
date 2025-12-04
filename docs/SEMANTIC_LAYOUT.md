# Réarrangement Spatial Sémantique des Nœuds

## 1. Mode d'emploi (Utilisateurs finaux)

### Présentation
La fonctionnalité de réarrangement spatial vous permet d'organiser automatiquement vos nœuds à l'intérieur d'un groupe pour améliorer la lisibilité et structurer vos idées.

### Comment l'utiliser ?
1.  **Créer un groupe** : Sélectionnez plusieurs nœuds et groupez-les, ou créez un groupe vide.
2.  **Ouvrir le menu** : Cliquez sur l'icône "Grille" située en haut à droite du groupe (à côté du nom).
3.  **Configurer** : Une fenêtre s'ouvre avec les options suivantes :
    *   **Style d'arrangement** :
        *   *Matriciel* : Range les nœuds par type (Texte, Image, etc.) en lignes et colonnes.
        *   *Hiérarchique* : Organise les nœuds sous forme d'arbre généalogique (utile pour les organigrammes).
        *   *Radial* : Place l'élément central au milieu et les autres autour.
        *   *Organique* : Simule une physique naturelle pour regrouper les éléments connectés.
    *   **Espacement** : Ajustez la distance entre les nœuds via le curseur.
4.  **Appliquer** : Cliquez sur "Appliquer le réarrangement". Les nœuds se déplaceront avec une animation fluide.

### Exemples de cas d'utilisation
*   **Brainstorming** : Utilisez le mode *Organique* pour regrouper naturellement les idées connectées.
*   **Organigramme** : Utilisez le mode *Hiérarchique* pour visualiser la structure d'une équipe ou d'un projet.
*   **Inventaire** : Utilisez le mode *Matriciel* pour trier vos ressources (images, fichiers, notes) par catégorie.

---

## 2. Spécification Technique (Développeurs)

### Architecture
La fonctionnalité repose sur trois composants principaux :

1.  **`SemanticLayoutEngine` (`src/utils/semanticLayout.ts`)**
    *   Classe utilitaire pure (stateless) contenant les algorithmes de placement.
    *   Prend en entrée : Liste de Nœuds, Liste d'Arêtes, Type de layout, Options.
    *   Retourne : Liste de Nœuds avec positions mises à jour `(x, y)`.
    *   **Optimisation** : L'algorithme "Matriciel" calcule désormais une largeur idéale basée sur la surface totale pour éviter les dispositions trop horizontales.

2.  **`LayoutConfigModal` (`src/components/LayoutConfigModal.tsx`)**
    *   Composant UI pour la configuration utilisateur.
    *   Gère l'état local du formulaire (type, spacing).

3.  **Intégration `Whiteboard` (`src/components/Whiteboard.tsx`)**
    *   Gère l'état d'ouverture de la modale via `layoutConfig`.
    *   Injecte le callback `onLayoutClick` dans les données des nœuds de type `group`.
    *   Applique les changements de position avec `setNodes` et gère l'animation CSS.
    *   **Redimensionnement automatique** : Le groupe parent s'ajuste automatiquement pour englober tous les nœuds réorganisés, avec une marge de confort.

### Algorithmes Implémentés

#### Grid (Matriciel)
*   **Logique** : Groupement par `node.type`.
*   **Tri** : Alphabétique sur `node.data.label`.
*   **Placement** : Packing ligne par ligne avec retour à la ligne automatique (`MAX_ROW_WIDTH = 1000px`).

#### Radial
*   **Centralité** : Déterminée par le degré du nœud (nombre de connexions).
*   **Placement** : Le nœud le plus connecté est à `(0,0)`. Les autres sont disposés sur un cercle de rayon `R`.

#### Hierarchy (Arbre)
*   **Racines** : Nœuds sans parents (in-degree = 0).
*   **Parcours** : BFS pour déterminer le niveau (profondeur) de chaque nœud.
*   **Placement** : Centrage de chaque niveau sur l'axe X, incrémentation sur l'axe Y.

#### Organic (Force-Directed)
*   **Simulation** : 50 itérations de forces répulsives (entre tous les nœuds) et attractives (liens).
*   **Stabilité** : Départ des positions actuelles pour éviter le chaos.

### Tests
Les tests unitaires sont situés dans `src/utils/semanticLayout.test.ts` et couvrent :
*   Le respect des types de layout.
*   La validité des coordonnées générées.
*   La préservation de l'intégrité des données (aucun nœud perdu).

### Évolutions futures
*   Intégration de `dagre` pour des hiérarchies complexes (minimisation des croisements).
*   Utilisation des embeddings vectoriels (RAG) pour le regroupement sémantique par sens du texte.
