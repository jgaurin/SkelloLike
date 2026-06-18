/// Configuration de connexion à Supabase.
///
/// Par défaut : projet Supabase Cloud de production (ritem).
/// La clé anon est publique (destinée au client), filtrée par la RLS.
///
/// Pour pointer vers le Supabase local en dev, lancer avec :
///   flutter run --dart-define=SUPABASE_URL=http://10.0.2.2:54321 \
///               --dart-define=SUPABASE_ANON_KEY=cle_locale
/// (10.0.2.2 = host depuis l'émulateur Android ; 127.0.0.1 sur web/desktop.)
class Config {
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://tnqpcsvzwyrfgicayhox.supabase.co',
  );

  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'sb_publishable_POVZbnllDAPmvlAcsPzVSw_qmRTo02n',
  );
}
