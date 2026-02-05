import 'package:flutter/material.dart';

class AppTheme {
  static const Color bgPrimary = Color(0xFF121212);
  static const Color bgSidebar = Color(0xFF0F172A);
  static const Color surfaceCard = Color(0xFF1E293B);
  static const Color border = Color(0xFF334155);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color primaryRed = Color(0xFFD32F2F);
  static const Color accentBlue = Color(0xFF3B82F6);

  static ThemeData get darkTheme {
    final base = ThemeData(
      brightness: Brightness.dark,
      useMaterial3: true,
      scaffoldBackgroundColor: bgPrimary,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryRed,
        brightness: Brightness.dark,
      ),
    );

    return base.copyWith(
      cardTheme: const CardThemeData(
        color: surfaceCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(14)),
          side: BorderSide(color: border),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bgPrimary,
        elevation: 0,
        centerTitle: false,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bgPrimary,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
      ),
    );
  }
}
