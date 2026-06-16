import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Charte visuelle alignée sur le web (src/app/globals.css).
/// Couleur principale = émeraude #059669. Police = Poppins (sans),
/// Geist Mono (mono). Les couleurs reprennent les tokens oklch du web,
/// convertis en sRGB.

// ── Tokens (équivalents des variables CSS du web) ──────────────────────────
const emerald = Color(0xFF059669); // --primary
const kForeground = Color(0xFF16201D); // --foreground  oklch(0.17 0.01 165)
const kMutedForeground = Color(0xFF6B7B76); // --muted-foreground
const kBorder = Color(0xFFE6EAE8); // --border / --input
const kCard = Color(0xFFFFFFFF); // --card
const kBackground = Color(0xFFFBFCFC); // fond global (proche du blanc)
const kMuted = Color(0xFFF1F5F3); // --muted / --secondary
const kDestructive = Color(0xFFDC2626); // --destructive

const double kRadius = 10; // --radius 0.625rem ≈ 10px

/// Famille mono (code de badgeuse) — Geist Mono comme sur le web.
TextStyle monoStyle({double? fontSize, FontWeight? fontWeight, double? letterSpacing}) =>
    GoogleFonts.geistMono(
      fontSize: fontSize,
      fontWeight: fontWeight,
      letterSpacing: letterSpacing,
      color: kForeground,
    );

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: emerald,
    brightness: Brightness.light,
  ).copyWith(
    primary: emerald,
    onPrimary: Colors.white,
    surface: kCard,
    onSurface: kForeground,
    error: kDestructive,
    outline: kBorder,
  );

  // Poppins appliqué à toute la typographie, en gardant la couleur foreground.
  final base = ThemeData(useMaterial3: true, colorScheme: scheme);
  final textTheme = GoogleFonts.poppinsTextTheme(base.textTheme).apply(
    bodyColor: kForeground,
    displayColor: kForeground,
  );

  return base.copyWith(
    scaffoldBackgroundColor: kBackground,
    textTheme: textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: kCard,
      foregroundColor: kForeground,
      elevation: 0,
      surfaceTintColor: kCard,
      titleTextStyle: GoogleFonts.poppins(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: kForeground,
      ),
    ),
    cardTheme: CardThemeData(
      color: kCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: kBorder),
      ),
    ),
    dividerTheme: const DividerThemeData(color: kBorder, thickness: 1),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: emerald,
        foregroundColor: Colors.white,
        textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(kRadius),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: kForeground,
        side: const BorderSide(color: kBorder),
        textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(kRadius),
        ),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: kCard,
      indicatorColor: emerald.withValues(alpha: 0.12),
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: states.contains(WidgetState.selected)
              ? FontWeight.w600
              : FontWeight.w400,
          color: states.contains(WidgetState.selected)
              ? emerald
              : kMutedForeground,
        ),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(
          color: states.contains(WidgetState.selected)
              ? emerald
              : kMutedForeground,
        ),
      ),
    ),
    tabBarTheme: TabBarThemeData(
      labelColor: emerald,
      unselectedLabelColor: kMutedForeground,
      indicatorColor: emerald,
      labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600),
      unselectedLabelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w400),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kCard,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(kRadius),
        borderSide: const BorderSide(color: kBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(kRadius),
        borderSide: const BorderSide(color: kBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(kRadius),
        borderSide: const BorderSide(color: emerald, width: 1.5),
      ),
    ),
  );
}
