# Règles ProGuard/R8 pour le build release.
# Flutter et ses plugins fournissent déjà leurs règles ; on garde les classes
# de l'embedding Flutter par sécurité.
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**
