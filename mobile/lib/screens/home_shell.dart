import 'package:flutter/material.dart';

import '../employee.dart';
import '../theme.dart';
import 'planning_screen.dart';
import 'absences_screen.dart';
import 'profil_screen.dart';

/// Shell principal après connexion : AppBar (avec avatar → profil) + bottom nav
/// (Planning / Absences). Charge une fois le contexte employé et le partage.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  late Future<EmployeeContext?> _ctxFuture;

  @override
  void initState() {
    super.initState();
    _ctxFuture = loadEmployeeContext();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<EmployeeContext?>(
      future: _ctxFuture,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final ctx = snap.data;
        if (ctx == null) {
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      "Aucun espace employé rattaché à ce compte.",
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => supabase.auth.signOut(),
                      child: const Text('Se déconnecter'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        final screens = [
          PlanningScreen(ctx: ctx),
          AbsencesScreen(ctx: ctx),
        ];

        return Scaffold(
          appBar: AppBar(
            title: const Text(
              'Ritem',
              style: TextStyle(color: emerald, fontWeight: FontWeight.bold),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: GestureDetector(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => ProfilScreen(ctx: ctx)),
                  ),
                  child: CircleAvatar(
                    radius: 18,
                    backgroundColor: emerald,
                    child: Text(
                      initials(ctx.fullName),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          body: IndexedStack(index: _index, children: screens),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (i) => setState(() => _index = i),
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.calendar_month_outlined),
                selectedIcon: Icon(Icons.calendar_month),
                label: 'Planning',
              ),
              NavigationDestination(
                icon: Icon(Icons.event_busy_outlined),
                selectedIcon: Icon(Icons.event_busy),
                label: 'Absences',
              ),
            ],
          ),
        );
      },
    );
  }
}
