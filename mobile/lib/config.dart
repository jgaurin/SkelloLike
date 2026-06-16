/// Configuration de connexion à Supabase.
///
/// En dev local, le projet web tourne sur http://127.0.0.1:54321.
/// Sur Flutter web (Chrome) on atteint 127.0.0.1 directement ; sur un
/// émulateur Android il faudrait remplacer par http://10.0.2.2:54321.
///
/// La clé anon est publique (destinée au client), elle est filtrée par la RLS.
class Config {
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'http://127.0.0.1:54321',
  );

  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
  );
}
