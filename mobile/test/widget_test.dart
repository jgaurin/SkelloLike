// Test smoke minimal : l'écran de login s'affiche sans planter.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ritem_mobile/screens/login_screen.dart';

void main() {
  testWidgets('Login screen renders', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: LoginScreen()));
    expect(find.text('Ritem'), findsOneWidget);
    expect(find.text('Se connecter'), findsOneWidget);
  });
}
