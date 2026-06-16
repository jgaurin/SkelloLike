# Ritem Mobile — Préparation Play Store

App employé (Flutter), branchée sur le même backend Supabase que le web.

## Identité de l'app

| | |
|---|---|
| Nom affiché | **Ritem** |
| Application ID | `com.ritem.mobile` (permanent une fois publié) |
| Version | `1.0.0+1` (`versionName+versionCode` dans `pubspec.yaml`) |
| Logo | `branding/logo.svg` → icônes générées dans `android/.../res/` |

## Signature (clé de release)

- Keystore : `android/ritem-release.jks` — **NON versionné** (git-ignoré).
- Secrets : `android/key.properties` — **NON versionné**.
- Mot de passe actuel : `ritem2026` (alias `ritem`).

> ⚠️ **À FAIRE avant la vraie publication** : changer ce mot de passe et
> sauvegarder `ritem-release.jks` + le mot de passe dans un endroit sûr.
> **Perdre cette clé = impossible de publier des mises à jour** de l'app.

Pour régénérer la clé (si besoin) :
```bash
keytool -genkeypair -v -keystore android/ritem-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias ritem
```

## Backend de production

L'app pointe par défaut sur le Supabase **local** (`127.0.0.1:54321`), pratique
pour le dev sur Chrome. **Pour un build destiné au Play Store**, il faut pointer
sur le Supabase de prod via `--dart-define` (aucune modif de code nécessaire) :

```bash
flutter build appbundle --release \
  --dart-define=SUPABASE_URL=https://VOTRE-PROJET.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=VOTRE_ANON_KEY_PROD
```

> ⚠️ Ne pas publier un build avec l'URL `127.0.0.1` : l'app ne pourrait pas
> joindre le backend depuis un téléphone.

## Construire le bundle Play Store (.aab)

```bash
cd mobile
flutter build appbundle --release   # + les --dart-define de prod ci-dessus
```
Sortie : `build/app/outputs/bundle/release/app-release.aab` → à uploader sur la
Play Console.

Pour tester un APK installable sur un téléphone :
```bash
flutter build apk --release
```

## Reste à faire côté Play Console (manuel, le jour de la publication)

- [ ] Créer le compte développeur Google Play (25 $ une fois).
- [ ] Créer l'app, renseigner la fiche (description, captures, catégorie).
- [ ] Fournir l'icône 512×512 (`branding/icon.png`) + bannière 1024×500.
- [ ] Politique de confidentialité (URL obligatoire).
- [ ] Renseigner le contenu (questionnaire data safety, public cible).
- [ ] Uploader le `.aab` signé, puis soumettre pour revue.
