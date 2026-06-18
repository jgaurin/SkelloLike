import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../employee.dart';
import '../theme.dart';
import '../week.dart';

/// Écran Absences : liste des demandes (avec annulation si en attente) +
/// bouton de nouvelle demande. Reproduit la section absences du web.
class AbsencesScreen extends StatefulWidget {
  final EmployeeContext ctx;
  const AbsencesScreen({super.key, required this.ctx});

  @override
  State<AbsencesScreen> createState() => _AbsencesScreenState();
}

class _AbsencesScreenState extends State<AbsencesScreen> {
  late Future<_AbsenceData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<void> _refresh() async {
    final f = _load();
    setState(() => _future = f);
    await f;
  }

  Future<_AbsenceData> _load() async {
    final results = await Future.wait([
      supabase
          .from('absence_requests')
          .select(
              'id, start_date, end_date, status, absence_types(name, color)')
          .eq('employee_id', widget.ctx.employeeId)
          .order('start_date', ascending: false),
      supabase
          .from('absence_types')
          .select('id, name')
          .eq('is_active', true)
          .eq('can_be_requested', true)
          .order('sort_order'),
    ]);
    return _AbsenceData(
      requests: List<Map<String, dynamic>>.from(results[0]),
      types: List<Map<String, dynamic>>.from(results[1]),
    );
  }

  Future<void> _cancel(String id) async {
    await supabase
        .from('absence_requests')
        .update({'status': 'cancelled'})
        .eq('id', id)
        .eq('employee_id', widget.ctx.employeeId)
        .eq('status', 'pending');
    _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_AbsenceData>(
      future: _future,
      builder: (context, snap) {
        if (!snap.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        final data = snap.data!;
        return Scaffold(
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () async {
              final created = await showModalBottomSheet<bool>(
                context: context,
                isScrollControlled: true,
                builder: (_) => _RequestSheet(
                  ctx: widget.ctx,
                  types: data.types,
                ),
              );
              if (created == true) _refresh();
            },
            backgroundColor: emerald,
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text('Demander',
                style: TextStyle(color: Colors.white)),
          ),
          body: RefreshIndicator(
            color: emerald,
            onRefresh: _refresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Mes demandes',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text('${data.requests.length} demande(s)',
                    style: const TextStyle(color: kMutedForeground)),
                const SizedBox(height: 12),
                if (data.requests.isEmpty)
                  const Text("Aucune demande pour l'instant.",
                      style: TextStyle(color: kMutedForeground))
                else
                  ...data.requests.map((r) => _RequestTile(
                        req: r,
                        onCancel: () => _cancel(r['id'] as String),
                      )),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _AbsenceData {
  final List<Map<String, dynamic>> requests;
  final List<Map<String, dynamic>> types;
  _AbsenceData({required this.requests, required this.types});
}

class _RequestTile extends StatelessWidget {
  final Map<String, dynamic> req;
  final VoidCallback onCancel;
  const _RequestTile({required this.req, required this.onCancel});

  @override
  Widget build(BuildContext context) {
    final type = req['absence_types'] as Map?;
    final color = _hex(type?['color'] as String?) ?? const Color(0xFF94A3B8);
    final status = req['status'] as String;
    final fmt = DateFormat('dd/MM/yyyy', 'fr_FR');
    final start = fmt.format(fromIso(req['start_date'] as String));
    final end = fmt.format(fromIso(req['end_date'] as String));

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: kBorder),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(type?['name'] as String? ?? 'Absence',
                    style: const TextStyle(fontWeight: FontWeight.w500)),
                Text('$start → $end',
                    style: const TextStyle(
                        fontSize: 12, color: kMutedForeground)),
              ],
            ),
          ),
          _StatusBadge(status: status),
          if (status == 'pending')
            IconButton(
              tooltip: 'Annuler',
              onPressed: onCancel,
              icon: const Icon(Icons.close, size: 18),
            ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'approved' => ('Validée', emerald),
      'pending' => ('En attente', const Color(0xFFD97706)),
      'rejected' => ('Refusée', const Color(0xFFDC2626)),
      'cancelled' => ('Annulée', kMutedForeground),
      _ => (status, kMutedForeground),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 12, fontWeight: FontWeight.w500)),
    );
  }
}

// ── Feuille de nouvelle demande ─────────────────────────────────────────────

class _RequestSheet extends StatefulWidget {
  final EmployeeContext ctx;
  final List<Map<String, dynamic>> types;
  const _RequestSheet({required this.ctx, required this.types});

  @override
  State<_RequestSheet> createState() => _RequestSheetState();
}

class _RequestSheetState extends State<_RequestSheet> {
  String? _typeId;
  DateTime? _start;
  DateTime? _end;
  bool _saving = false;
  String? _error;

  Future<void> _pick(bool isStart) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: (isStart ? _start : _end) ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _start = picked;
        } else {
          _end = picked;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (_typeId == null || _start == null || _end == null) {
      setState(() => _error = 'Type et dates requis.');
      return;
    }
    if (_end!.isBefore(_start!)) {
      setState(() => _error = 'La date de fin doit suivre la date de début.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await supabase.from('absence_requests').insert({
        'employee_id': widget.ctx.employeeId,
        'type_id': _typeId,
        'start_date': toIso(_start!),
        'end_date': toIso(_end!),
        'status': 'pending',
      });
      if (mounted) Navigator.of(context).pop(true);
    } catch (_) {
      setState(() {
        _error = "Impossible d'envoyer la demande.";
        _saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('dd/MM/yyyy', 'fr_FR');
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Nouvelle demande',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _typeId,
            decoration: const InputDecoration(labelText: "Type d'absence"),
            items: widget.types
                .map((t) => DropdownMenuItem(
                      value: t['id'] as String,
                      child: Text(t['name'] as String),
                    ))
                .toList(),
            onChanged: (v) => setState(() => _typeId = v),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _pick(true),
                  child: Text(_start == null ? 'Début' : fmt.format(_start!)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _pick(false),
                  child: Text(_end == null ? 'Fin' : fmt.format(_end!)),
                ),
              ),
            ],
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Color(0xFFB91C1C))),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _saving ? null : _submit,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            child: _saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Envoyer la demande'),
          ),
        ],
      ),
    );
  }
}

Color? _hex(String? s) {
  if (s == null) return null;
  final h = s.replaceFirst('#', '');
  if (h.length != 6) return null;
  final v = int.tryParse(h, radix: 16);
  return v == null ? null : Color(0xFF000000 | v);
}
