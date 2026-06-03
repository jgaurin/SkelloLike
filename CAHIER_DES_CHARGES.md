# Cahier des Charges — SkelloLike
**Stack : Next.js 15 (App Router) + Supabase + TypeScript**
**Version : 1.0 — 2026-06-03**

---

## 1. Présentation du projet

### 1.1 Objectif
Développer une application SaaS de gestion des plannings et des ressources humaines, clone fonctionnel de Skello, destinée aux entreprises multi-sites avec des équipes horaires (restauration, retail, hôtellerie, santé, etc.).

### 1.2 Positionnement
- Application web responsive (priorité desktop pour les managers)
- Application mobile pour les employés (phase 2)
- Multi-tenant : chaque entreprise est isolée
- Multi-établissements : une entreprise peut gérer N sites

### 1.3 Stack technique
| Couche | Technologie |
|---|---|
| Frontend | Next.js 15, App Router, TypeScript, Tailwind CSS |
| Backend/API | Next.js API Routes + Supabase Edge Functions |
| Base de données | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password, magic link, SSO SAML) |
| Realtime | Supabase Realtime (mises à jour planning en live) |
| Stockage | Supabase Storage (documents, photos) |
| Emails | Resend (notifications, exports) |
| PDF | react-pdf ou Puppeteer (exports planning, fiches de paie) |
| Graphiques | Recharts ou Chart.js |
| State management | Zustand + React Query (TanStack) |

---

## 2. Architecture multi-tenant

### 2.1 Modèle de données racine
```
Organization (entreprise cliente)
  └── Location (établissement / site)
        └── Team (équipe / service)
              └── Employee (employé)
```

### 2.2 Isolation des données
- Row Level Security (RLS) Supabase sur toutes les tables
- Chaque requête filtrée par `organization_id`
- Les super-admins Skello ont accès à tout (table interne)

---

## 3. Gestion des utilisateurs et rôles

### 3.1 Rôles système
| Rôle | Description |
|---|---|
| `super_admin` | Accès back-office Skello (administration plateforme) |
| `org_owner` | Propriétaire d'une organisation (billing, création de sites) |
| `org_admin` | Administrateur RH de l'organisation |
| `location_manager` | Manager d'un ou plusieurs établissements |
| `team_manager` | Manager d'une équipe spécifique |
| `employee` | Employé, accès lecture seule à son planning |

### 3.2 Permissions par rôle
- **org_owner** : tout + facturation + suppression organisation
- **org_admin** : gestion employés, contrats, paie, tous les sites
- **location_manager** : planning, employés, compteurs d'un site
- **team_manager** : planning et employés de son équipe uniquement
- **employee** : voir son planning, poser des congés, pointer (si activé)

### 3.3 Profil employé
- Prénom, nom, email, téléphone, photo
- Numéro de matricule
- Date d'entrée, date de sortie
- Rôle(s) et équipe(s) d'appartenance
- Contrat associé
- Niveau d'accès à l'application
- Langue préférée (FR, EN, ES, DE)
- Statut : actif / inactif / archivé

---

## 4. Gestion des établissements (Locations)

### 4.1 Données d'un établissement
- Nom, adresse, code postal, ville, pays
- Timezone (important pour le calcul des heures)
- Secteur d'activité (restauration, retail, santé, etc.)
- Horaires d'ouverture (plages d'activité)
- Couleur d'identification
- Photo / logo

### 4.2 Configuration par établissement
- Jours de la semaine travaillés
- Heure de début de journée (ex : 6h00 pour la restauration)
- Règles de pauses automatiques
- Convention collective applicable
- Paramètres de pointage (activé/désactivé, tolérance en minutes)

---

## 5. Gestion des contrats et configurations RH

### 5.1 Types de contrats
- CDI (durée indéterminée)
- CDD (durée déterminée, avec date de fin obligatoire)
- Intérim
- Extra / Vacation
- Apprentissage / Alternance
- Stage

### 5.2 Données d'un contrat
- Type de contrat
- Date de début / date de fin (si applicable)
- Durée hebdomadaire contractuelle (ex : 35h, 20h, 39h)
- Taux horaire brut
- Qualification / poste
- Convention collective
- Statut : cadre / non-cadre / agent de maîtrise
- Modalités de rémunération : taux fixe, heures réelles, forfait jours

### 5.3 Qualifications / Postes
- Nom du poste (ex : Serveur, Chef de rang, Caissier)
- Couleur associée (affichée sur le planning)
- Taux horaire par défaut
- Compétences requises
- Possibilité d'assigner plusieurs postes à un employé

---

## 6. Planning (module central)

### 6.1 Vues disponibles
| Vue | Description |
|---|---|
| Semaine | Vue principale, 7 jours, liste des employés en lignes |
| Mois | Vue mensuelle condensée par employé |
| Jour | Vue détaillée d'une seule journée |
| Multi-sites | Vue agrégée de plusieurs établissements |
| Par poste | Regroupement par qualification plutôt que par employé |

### 6.2 Structure d'un shift (créneau)
- Employé assigné
- Date
- Heure de début / heure de fin
- Poste / qualification
- Lieu (si multi-postes dans un même site)
- Note interne (visible managers uniquement)
- Note employé (visible par l'employé)
- Statut : brouillon / publié / confirmé / annulé
- Couleur (héritée du poste ou personnalisée)
- Pauses (durée, payée ou non)

### 6.3 Création et édition de shifts
- Clic sur une cellule → création rapide
- Drag & drop pour déplacer un shift
- Redimensionnement (drag sur les bords) pour modifier les heures
- Copier / coller un shift (même employé, autre jour)
- Copier une semaine entière
- Dupliquer le planning d'une semaine à une autre
- Sélection multiple (shift + clic)
- Actions en masse sur la sélection (supprimer, changer poste, publier)

### 6.4 Gestion des absences sur le planning
- Affichage des absences directement dans le planning (congés, maladie, etc.)
- Les jours d'absence sont verrouillés pour éviter les chevauchements
- Indicateurs visuels distincts par type d'absence

### 6.5 Publication du planning
- Le planning peut être en mode **brouillon** (non visible par les employés)
- **Publication** rend le planning visible aux employés
- Notification automatique aux employés lors de la publication
- Historique des publications (qui a publié, quand)
- Possibilité de publier par semaine, par équipe, ou globalement

### 6.6 Modèles de planning (templates)
- Sauvegarder une semaine comme modèle
- Nommer le modèle
- Appliquer un modèle à n'importe quelle semaine future
- Gestion d'une bibliothèque de modèles
- Modèles partagés entre managers du même établissement

### 6.7 Contraintes et alertes automatiques
- Dépassement des heures contractuelles (alerte visuelle)
- Durée minimale de repos entre deux shifts (ex : 11h)
- Durée maximale de shift (ex : 10h)
- Shift sur un jour de repos contractuel
- Conflit avec une absence validée
- Compétence manquante (l'employé n'a pas le poste assigné)
- Heures supplémentaires dépassant un seuil paramétrable
- Mineur : pas de travail après 22h
- Toutes les alertes sont configurables (bloquantes ou informatives)

### 6.8 Besoins prévisionnels (staffing)
- Définir le nombre de personnes nécessaires par créneau horaire et par poste
- Visualisation du taux de couverture (vert/orange/rouge)
- Écart entre besoins prévus et shifts planifiés

### 6.9 Disponibilités employés
- Un employé peut renseigner ses disponibilités (jours/heures)
- Contraintes de disponibilité affichées au manager lors de la planification
- Alertes si un shift est créé en dehors des disponibilités déclarées

### 6.10 Échanges de shifts (swap)
- Un employé peut demander l'échange d'un shift avec un collègue
- Le manager valide ou refuse l'échange
- Notifications aux deux employés concernés

---

## 7. Gestion des absences et congés

### 7.1 Types d'absences
- Congés payés (CP)
- RTT
- Congés sans solde
- Maladie (avec ou sans justificatif)
- Accident du travail
- Maternité / Paternité / Adoption
- Congé formation
- Congé exceptionnel (mariage, décès, etc.)
- Absence injustifiée
- Chômage partiel
- Types personnalisés (configurables par l'organisation)

### 7.2 Demande de congés (côté employé)
- Sélection de la période (date début / date fin)
- Type d'absence
- Commentaire optionnel
- Soumission de la demande
- Suivi du statut (en attente / validé / refusé)
- Modification ou annulation avant validation

### 7.3 Validation des congés (côté manager)
- Liste des demandes en attente
- Vue calendrier des absences de l'équipe (pour visualiser la couverture)
- Validation / refus avec commentaire
- Validation partielle (ex : valider 3 jours sur 5)
- Délégation de validation
- Notifications automatiques à l'employé

### 7.4 Compteurs de congés
- Solde CP (acquis / pris / restant)
- Solde RTT
- Historique de toutes les absences par employé
- Calcul automatique des acquisitions selon la convention collective
- Ajustement manuel par le manager (avec motif et traçabilité)
- Export des compteurs

### 7.5 Calendrier des absences
- Vue globale des absences par équipe / établissement
- Filtre par type d'absence, par équipe, par période
- Alertes si trop d'absences simultanées (sous-effectif)

---

## 8. Pointage (Time & Attendance)

### 8.1 Modes de pointage
- **Web** : depuis l'application navigateur (tablette en mode kiosque)
- **Mobile** : depuis l'app mobile employé (phase 2)
- **Badgeuse NFC/QR** : intégration externe possible (phase 2)

### 8.2 Fonctionnement
- Pointage entrée / sortie
- Pointage début/fin de pause
- Localisation GPS optionnelle (validation que l'employé est sur site)
- Photo à la pointeuse (optionnelle, anti-fraude)
- Code PIN ou QR code personnel par employé

### 8.3 Gestion des pointages
- Tableau de bord des pointages du jour (présents, absents, en retard)
- Comparaison shift planifié vs heures réelles pointées
- Retards et heures sup automatiquement calculés
- Régularisation manuelle par le manager (avec commentaire)
- Blocage du pointage en dehors d'une plage horaire (± tolérance)

### 8.4 Rapports de pointage
- Export CSV/Excel des pointages
- Rapport par période, par employé, par équipe
- Heures effectuées vs heures contractuelles

---

## 9. Gestion de la paie (Pré-paie)

### 9.1 Récapitulatif des heures
- Total heures travaillées par période (semaine / mois / quinzaine)
- Ventilation : heures normales / heures sup / heures de nuit / heures de dimanche / jours fériés
- Calcul automatique basé sur les pointages ou les shifts planifiés (au choix)

### 9.2 Majorations automatiques
- Heures supplémentaires (25% pour les 8 premières, 50% au-delà, selon convention)
- Heures de nuit (définition des plages paramétrables, ex : 21h–6h)
- Dimanche et jours fériés (majoration paramétrable)
- Heures du dimanche non majorées si contrat le prévoit

### 9.3 Export paie
- Export au format CSV/Excel vers logiciels de paie tiers
- Connecteurs natifs : **Silae**, **Sage**, **Cegid**, **ADP**, **Payfit** (paramétrage du mapping)
- Format d'export personnalisable par organisation
- Historique des exports

### 9.4 Bulletins de paie (optionnel, phase 2)
- Génération de bulletins simplifiés depuis l'application
- Envoi par email aux employés

---

## 10. Documents RH

### 10.1 Gestion documentaire par employé
- Upload de documents (contrat, avenant, DPAE, etc.)
- Catégorisation (contrat, pièce d'identité, diplôme, etc.)
- Signature électronique (intégration Yousign ou DocuSign)
- Suivi des documents manquants / expirés
- Notifications avant expiration (ex : titre de séjour)

### 10.2 Modèles de documents
- Création de modèles avec variables dynamiques (nom, prénom, date, poste...)
- Génération automatique de contrats, avenants, attestations
- Envoi pour signature en un clic

### 10.3 DPAE (Déclaration Préalable À l'Embauche)
- Génération automatique de la DPAE lors de la création d'un contrat CDD/CDI
- Envoi à l'URSSAF (via API ou export)

---

## 11. Communication interne

### 11.1 Messagerie
- Messagerie interne entre managers et employés
- Conversations individuelles ou en groupe
- Envoi de fichiers joints
- Notifications push (web + mobile phase 2)

### 11.2 Annonces
- Système d'annonces de l'établissement (one-to-many)
- Accusé de réception (l'employé confirme avoir lu)
- Ciblage par équipe / par rôle

### 11.3 Notifications
| Événement | Destinataire |
|---|---|
| Planning publié | Tous les employés concernés |
| Shift modifié / annulé | Employé concerné |
| Demande de congé soumise | Manager |
| Congé validé / refusé | Employé |
| Échange de shift demandé | Manager + employé cible |
| Document à signer | Employé |
| Rappel de shift (J-1 ou H-2) | Employé |

Canaux : email, notification in-app, push mobile (phase 2), SMS (optionnel, via Twilio)

---

## 12. Tableaux de bord et analytics

### 12.1 Dashboard manager (par établissement)
- Taux de présence du jour (temps réel)
- Heures planifiées vs heures contractuelles (semaine en cours)
- Coût masse salariale estimé (semaine / mois)
- Nombre d'absences en cours
- Alertes actives (conflits planning, demandes en attente)
- Shift sans employé assigné (trous dans le planning)

### 12.2 Dashboard RH (org_admin)
- Vue agrégée multi-sites
- Turnover (taux d'entrées/sorties)
- Taux d'absentéisme par site et par période
- Évolution de la masse salariale
- Effectif actuel par site et par type de contrat

### 12.3 Rapports disponibles
| Rapport | Filtres | Export |
|---|---|---|
| Heures travaillées | Période, employé, équipe, site | CSV, Excel, PDF |
| Coût horaire et masse salariale | Période, site | CSV, Excel |
| Absentéisme | Période, type, site | CSV, Excel, PDF |
| Congés et compteurs | Employé, période | CSV, Excel |
| Pointages détaillés | Période, employé | CSV, Excel |
| Comparatif planifié vs réel | Semaine, mois | CSV, Excel, PDF |
| Heures supplémentaires | Période, employé | CSV, Excel |

---

## 13. Gestion des indisponibilités et jours fériés

### 13.1 Jours fériés
- Calendrier des jours fériés par pays (FR, BE, ES, CH, etc.)
- Jours fériés affichés sur le planning avec indicateur visuel
- Calcul automatique des majorations

### 13.2 Jours de fermeture
- Le manager peut marquer des jours de fermeture d'établissement
- Blocage de la planification sur ces jours

### 13.3 Périodes de forte activité
- Marquage de périodes spéciales (Noël, fêtes locales, etc.)
- Indicateur visuel sur le planning pour anticiper les besoins

---

## 14. Facturation et abonnements (Back-office SaaS)

### 14.1 Plans tarifaires
- **Starter** : jusqu'à 1 site, 20 employés
- **Growth** : jusqu'à 5 sites, 100 employés
- **Enterprise** : illimité, fonctionnalités avancées, SLA, SSO

### 14.2 Facturation
- Abonnement mensuel ou annuel
- Prix par employé actif (modèle pay-per-seat)
- Intégration Stripe (checkout, facturation récurrente, portail client)
- Génération de factures PDF automatiques
- Gestion des upgrades/downgrades en self-service

### 14.3 Période d'essai
- 14 jours gratuits, sans carte bancaire
- Onboarding guidé (wizard de configuration)

---

## 15. Onboarding et configuration initiale

### 15.1 Wizard de création de compte
1. Créer un compte (email + mot de passe ou SSO)
2. Informations de l'organisation (nom, secteur, taille)
3. Créer le premier établissement
4. Importer ou créer les employés (upload CSV ou saisie manuelle)
5. Configurer les postes / qualifications
6. Créer le premier planning

### 15.2 Import de données
- Import CSV/Excel des employés (mapping de colonnes)
- Import des contrats
- Import des compteurs de congés existants
- Validation des données avant import (erreurs signalées ligne par ligne)

---

## 16. Intégrations tierces

| Système | Type | Priorité |
|---|---|---|
| Silae | Export paie | P1 |
| Sage Paie | Export paie | P1 |
| Cegid | Export paie | P2 |
| ADP | Export paie | P2 |
| Payfit | Export paie | P2 |
| Yousign | Signature électronique | P1 |
| DocuSign | Signature électronique | P2 |
| Slack | Notifications | P3 |
| Google Workspace | SSO | P2 |
| Microsoft Azure AD | SSO SAML | P2 |
| Zapier / Make | Webhooks généralistes | P3 |
| API REST publique | Intégrations custom | P2 |

---

## 17. Sécurité et conformité

### 17.1 Authentification
- Email + mot de passe (avec règles de complexité)
- Magic link (connexion sans mot de passe)
- SSO SAML 2.0 (Google, Microsoft, Okta)
- 2FA (TOTP via application, ex : Google Authenticator)
- Blocage après N tentatives échouées

### 17.2 Sécurité des données
- Chiffrement en transit (HTTPS / TLS 1.3)
- Chiffrement au repos (Supabase)
- RLS PostgreSQL : isolation totale par organisation
- Logs d'audit (qui a fait quoi, quand) sur toutes les actions sensibles
- Suppression de compte et export des données (RGPD)

### 17.3 RGPD
- Politique de confidentialité et CGU
- Consentement explicite lors de l'inscription
- Droit à l'oubli (suppression des données personnelles)
- Export des données personnelles sur demande
- DPA (Data Processing Agreement) disponible pour les clients enterprise

### 17.4 Disponibilité
- SLA 99.9% uptime (hors maintenance planifiée)
- Backups automatiques quotidiens (Supabase)
- Monitoring (Sentry pour les erreurs, uptime monitoring)

---

## 18. Interface utilisateur

### 18.1 Design system
- Palette de couleurs : violet/mauve (référence Skello) + couleurs neutres
- Typographie : Inter ou Geist
- Composants : shadcn/ui (basé sur Radix UI) + Tailwind CSS
- Mode sombre (dark mode) optionnel

### 18.2 Responsive
- Desktop : expérience principale (1280px+)
- Tablette : usage pointeuse en mode kiosque (768px)
- Mobile web : consultation planning uniquement (phase 1)

### 18.3 Accessibilité
- Conformité WCAG 2.1 niveau AA
- Navigation clavier complète
- Contrastes suffisants
- Labels ARIA

### 18.4 Performances
- Core Web Vitals : LCP < 2.5s, FID < 100ms, CLS < 0.1
- Pagination et virtualisation pour les grandes listes
- Chargement optimiste (optimistic updates) sur les actions planning

---

## 19. Localisation et internationalisation (i18n)

- Langues : Français (défaut), Anglais, Espagnol, Allemand
- next-intl pour la gestion des traductions
- Formats de date adaptés par locale
- Timezones par établissement
- Devises : EUR (défaut), GBP, CHF

---

## 20. API REST publique

### 20.1 Authentification API
- Clés API par organisation (générées depuis les paramètres)
- OAuth 2.0 pour les intégrations tierces

### 20.2 Endpoints principaux
- `GET/POST /employees` — gestion des employés
- `GET/POST/PUT /shifts` — gestion des shifts
- `GET /schedules` — lecture du planning
- `GET/POST /absences` — gestion des absences
- `GET /timeclocks` — pointages
- `GET /reports/hours` — heures travaillées
- `POST /webhooks` — abonnement aux événements

### 20.3 Documentation
- Documentation OpenAPI (Swagger UI) auto-générée
- Sandbox de test

---

## 21. Back-office Skello (super-admin)

### 21.1 Fonctionnalités super-admin
- Liste de toutes les organisations
- Impersonation d'un compte (accès en lecture pour le support)
- Suspension / réactivation d'une organisation
- Gestion des plans et du billing
- Métriques globales (MRR, churn, DAU, MAU)
- Gestion des feature flags par organisation

---

## 22. Roadmap et phases de développement

### Phase 1 — MVP (mois 1-4)
- [ ] Auth (inscription, connexion, rôles)
- [ ] Gestion organisations et établissements
- [ ] Gestion employés et contrats
- [ ] Postes / qualifications
- [ ] Planning semaine (création, édition, drag & drop)
- [ ] Publication du planning
- [ ] Absences simples (demande, validation)
- [ ] Compteurs CP basiques
- [ ] Notifications email
- [ ] Dashboard manager basique

### Phase 2 — Core RH (mois 5-7)
- [ ] Pointage web (kiosque tablette)
- [ ] Pré-paie et exports
- [ ] Documents RH + modèles
- [ ] Messagerie interne
- [ ] Modèles de planning (templates)
- [ ] Rapports et analytics
- [ ] Import CSV employés
- [ ] Multi-sites

### Phase 3 — Scale & Intégrations (mois 8-10)
- [ ] App mobile employés (React Native / Expo)
- [ ] Intégrations logiciels de paie (Silae, Sage)
- [ ] Signature électronique (Yousign)
- [ ] SSO SAML
- [ ] API REST publique
- [ ] Facturation Stripe
- [ ] Besoins prévisionnels (staffing)
- [ ] Échanges de shifts

---

## 23. Modèle de données (schéma Supabase)

### Tables principales

```sql
-- Multi-tenant
organizations (id, name, slug, plan, stripe_customer_id, created_at)
locations (id, org_id, name, address, timezone, config jsonb)
teams (id, location_id, name, color)

-- RH
employees (id, org_id, user_id, first_name, last_name, email, phone, photo_url, status, hire_date, exit_date)
contracts (id, employee_id, type, start_date, end_date, weekly_hours, hourly_rate, position_id)
positions (id, org_id, name, color, default_rate)
employee_positions (employee_id, position_id) -- many-to-many

-- Planning
schedules (id, location_id, week_start, status, published_at, published_by)
shifts (id, schedule_id, employee_id, position_id, date, start_time, end_time, break_duration, note_manager, note_employee, status)
schedule_templates (id, location_id, name, created_by)
template_shifts (id, template_id, day_of_week, position_id, start_time, end_time)

-- Absences
absence_types (id, org_id, name, color, affects_counter)
absence_requests (id, employee_id, type_id, start_date, end_date, status, comment, reviewed_by, reviewed_at)
leave_balances (id, employee_id, type_id, year, acquired, taken, adjusted)

-- Pointage
timeclocks (id, employee_id, shift_id, clock_in, clock_out, break_start, break_end, location_lat, location_lng, status)

-- Communication
messages (id, org_id, sender_id, content, created_at)
message_participants (message_id, employee_id)
announcements (id, location_id, title, content, target_teams, created_by)
announcement_reads (announcement_id, employee_id, read_at)

-- Documents
documents (id, employee_id, category, name, file_url, expires_at, signed_at)

-- Audit
audit_logs (id, org_id, user_id, action, resource_type, resource_id, metadata jsonb, created_at)
```

---

## 24. Critères de qualité

| Critère | Cible |
|---|---|
| Couverture de tests | ≥ 80% (Vitest + Playwright) |
| Temps de chargement planning | < 1s pour 50 employés / 1 semaine |
| Uptime | 99.9% |
| TTFB | < 200ms |
| Score Lighthouse | ≥ 90 |
| Accessibilité WCAG | 2.1 AA |

---

*Cahier des charges rédigé le 2026-06-03. Ce document est évolutif et sera mis à jour à chaque sprint.*
