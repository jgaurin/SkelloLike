import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../employee.dart';
import '../theme.dart';
import '../week.dart';

/// Écran Profil : identité, code de badgeuse (masqué par défaut) et
/// coordonnées. Le matricule n'est pas exposé (comme côté web).
class ProfilScreen extends StatefulWidget {
  final EmployeeContext ctx;
  const ProfilScreen({super.key, required this.ctx});

  @override
  State<ProfilScreen> createState() => _ProfilScreenState();
}

class _ProfilScreenState extends State<ProfilScreen> {
  bool _revealed = false;

  @override
  Widget build(BuildContext context) {
    final ctx = widget.ctx;
    final infos = <(IconData, String, String?)>[
      (Icons.mail_outline, 'Email', ctx.email),
      (Icons.phone_outlined, 'Téléphone', ctx.phone),
      (
        Icons.event_available_outlined,
        "Date d'entrée",
        ctx.hireDate == null
            ? null
            : DateFormat('d MMMM yyyy', 'fr_FR').format(fromIso(ctx.hireDate!)),
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Mon profil')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Identité
          Row(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: emerald,
                child: Text(
                  initials(ctx.fullName),
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ctx.fullName,
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w600)),
                    Text(ctx.orgName,
                        style: const TextStyle(color: kMutedForeground)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Code de badgeuse
          _PinCard(
            pinCode: ctx.pinCode,
            revealed: _revealed,
            onToggle: () => setState(() => _revealed = !_revealed),
          ),
          const SizedBox(height: 16),

          // Coordonnées
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: kBorder),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                for (var i = 0; i < infos.length; i++) ...[
                  if (i > 0) const Divider(height: 1),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(infos[i].$1,
                            size: 18, color: kMutedForeground),
                        const SizedBox(width: 12),
                        SizedBox(
                          width: 110,
                          child: Text(infos[i].$2,
                              style:
                                  const TextStyle(color: kMutedForeground)),
                        ),
                        Expanded(
                          child: Text(
                            infos[i].$3 ?? '—',
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Déconnexion
          OutlinedButton.icon(
            onPressed: () async {
              await supabase.auth.signOut();
              if (context.mounted) Navigator.of(context).pop();
            },
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              foregroundColor: kDestructive,
            ),
            icon: const Icon(Icons.logout),
            label: const Text('Se déconnecter'),
          ),
        ],
      ),
    );
  }
}

class _PinCard extends StatelessWidget {
  final String? pinCode;
  final bool revealed;
  final VoidCallback onToggle;
  const _PinCard({
    required this.pinCode,
    required this.revealed,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: kBorder),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.vpn_key_outlined, size: 18, color: emerald),
              SizedBox(width: 8),
              Text('Code de badgeuse',
                  style: TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
          if (pinCode != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  revealed ? pinCode! : '••••',
                  style: monoStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 8,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: onToggle,
                  icon: Icon(revealed
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined),
                ),
              ],
            ),
            const SizedBox(height: 4),
            const Text(
              'Saisissez ce code à 4 chiffres sur la borne pour pointer votre arrivée, vos pauses et votre départ.',
              style: TextStyle(fontSize: 12, color: kMutedForeground),
            ),
          ] else ...[
            const SizedBox(height: 12),
            const Text(
              'Aucun code défini — contactez votre manager pour pouvoir pointer.',
              style: TextStyle(color: kMutedForeground),
            ),
          ],
        ],
      ),
    );
  }
}
