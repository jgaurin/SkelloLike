import 'package:flutter/material.dart';

import '../employee.dart';
import '../theme.dart';
import '../week.dart';

/// Écran Planning : deux onglets, "Mes shifts" (semaine) et "Toute l'équipe"
/// (jour). Reproduit la page /mon-espace du web (shifts publiés uniquement).
class PlanningScreen extends StatefulWidget {
  final EmployeeContext ctx;
  const PlanningScreen({super.key, required this.ctx});

  @override
  State<PlanningScreen> createState() => _PlanningScreenState();
}

class _PlanningScreenState extends State<PlanningScreen> {
  String _weekStart = getMonday();
  String _day = toIso(DateTime.now());

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          const TabBar(
            labelColor: emerald,
            indicatorColor: emerald,
            tabs: [
              Tab(text: 'Mes shifts'),
              Tab(text: "Toute l'équipe"),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                _MyShiftsTab(
                  ctx: widget.ctx,
                  weekStart: _weekStart,
                  onWeek: (delta) =>
                      setState(() => _weekStart = shiftWeek(_weekStart, delta)),
                ),
                _TeamTab(
                  ctx: widget.ctx,
                  day: _day,
                  onDay: (delta) =>
                      setState(() => _day = shiftDay(_day, delta)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Onglet "Mes shifts" (semaine) ───────────────────────────────────────────

class _MyShiftsTab extends StatelessWidget {
  final EmployeeContext ctx;
  final String weekStart;
  final void Function(int delta) onWeek;

  const _MyShiftsTab({
    required this.ctx,
    required this.weekStart,
    required this.onWeek,
  });

  Future<List<Map<String, dynamic>>> _load() async {
    final days = weekDates(weekStart);
    final rows = await supabase
        .from('shifts')
        .select(
            'id, shift_date, start_time, end_time, break_minutes, positions(name, color), schedules!inner(status)')
        .eq('employee_id', ctx.employeeId)
        .eq('status', 'published')
        .gte('shift_date', days.first)
        .lte('shift_date', days.last);
    return List<Map<String, dynamic>>.from(rows);
  }

  @override
  Widget build(BuildContext context) {
    final days = weekDates(weekStart);
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _load(),
      builder: (context, snap) {
        if (!snap.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        final byDay = <String, List<Map<String, dynamic>>>{};
        double total = 0;
        for (final s in snap.data!) {
          final d = s['shift_date'] as String;
          (byDay[d] ??= []).add(s);
          total += shiftHours(
            trimSeconds(s['start_time'] as String),
            trimSeconds(s['end_time'] as String),
            (s['break_minutes'] as num?)?.toInt() ?? 0,
          );
        }

        return Column(
          children: [
            _WeekNav(
              label: formatWeekRange(weekStart),
              sub: '${total.round()}h cette semaine',
              onPrev: () => onWeek(-1),
              onNext: () => onWeek(1),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
                itemCount: days.length,
                itemBuilder: (context, i) {
                  final d = days[i];
                  final shifts = (byDay[d] ?? [])
                    ..sort((a, b) => (a['start_time'] as String)
                        .compareTo(b['start_time'] as String));
                  return _DayRow(date: d, index: i, shifts: shifts);
                },
              ),
            ),
          ],
        );
      },
    );
  }
}

class _DayRow extends StatelessWidget {
  final String date;
  final int index;
  final List<Map<String, dynamic>> shifts;
  const _DayRow({required this.date, required this.index, required this.shifts});

  @override
  Widget build(BuildContext context) {
    final today = isToday(date);
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: today ? emerald.withValues(alpha: 0.05) : Colors.white,
        border: Border.all(
          color: today ? emerald.withValues(alpha: 0.4) : kBorder,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 44,
            child: Column(
              children: [
                Text(
                  weekdaysShort[index],
                  style: const TextStyle(
                      fontSize: 11, color: kMutedForeground),
                ),
                Text(
                  '${fromIso(date).day}',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: today ? emerald : kForeground,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: shifts.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text('Repos',
                        style: TextStyle(color: kMutedForeground)),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: shifts.map((s) {
                      final pos = s['positions'] as Map?;
                      final color = _hex(pos?['color'] as String?) ?? emerald;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: color,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${trimSeconds(s['start_time'])} – ${trimSeconds(s['end_time'])}'
                          '${pos?['name'] != null ? ' · ${pos!['name']}' : ''}',
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w500,
                              fontSize: 13),
                        ),
                      );
                    }).toList(),
                  ),
          ),
        ],
      ),
    );
  }
}

// ── Onglet "Toute l'équipe" (jour) ──────────────────────────────────────────

class _TeamTab extends StatelessWidget {
  final EmployeeContext ctx;
  final String day;
  final void Function(int delta) onDay;

  const _TeamTab({required this.ctx, required this.day, required this.onDay});

  Future<List<_TeamMember>> _load() async {
    final results = await Future.wait([
      supabase
          .from('shifts')
          .select(
              'id, employee_id, start_time, end_time, positions(name, color), employees(first_name, last_name), schedules!inner(status)')
          .eq('shift_date', day)
          .eq('status', 'published'),
      supabase
          .from('employees')
          .select('id, first_name, last_name')
          .eq('status', 'active')
          .order('last_name'),
      supabase
          .from('absence_requests')
          .select('employee_id, absence_types(name, color)')
          .eq('status', 'approved')
          .lte('start_date', day)
          .gte('end_date', day),
    ]);

    final shifts = List<Map<String, dynamic>>.from(results[0]);
    final employees = List<Map<String, dynamic>>.from(results[1]);
    final absences = List<Map<String, dynamic>>.from(results[2]);

    final shiftsByEmp = <String, List<Map<String, dynamic>>>{};
    for (final s in shifts) {
      final id = s['employee_id'] as String?;
      if (id != null) (shiftsByEmp[id] ??= []).add(s);
    }
    final absenceByEmp = <String, Map<String, dynamic>>{};
    for (final a in absences) {
      final id = a['employee_id'] as String?;
      if (id != null) absenceByEmp[id] = a['absence_types'] as Map<String, dynamic>? ?? {};
    }

    final members = employees.map((e) {
      final id = e['id'] as String;
      final empShifts = (shiftsByEmp[id] ?? [])
        ..sort((a, b) => (a['start_time'] as String)
            .compareTo(b['start_time'] as String));
      final absence = absenceByEmp[id];
      final status = empShifts.isNotEmpty
          ? 'working'
          : absence != null
              ? 'absence'
              : 'off';
      return _TeamMember(
        name: '${e['first_name']} ${e['last_name']}',
        isMine: id == ctx.employeeId,
        status: status,
        shifts: empShifts,
        absenceName: absence?['name'] as String?,
        absenceColor: _hex(absence?['color'] as String?),
      );
    }).toList();

    const order = {'working': 0, 'absence': 1, 'off': 2};
    members.sort((a, b) {
      if (a.isMine != b.isMine) return a.isMine ? -1 : 1;
      if (order[a.status] != order[b.status]) {
        return order[a.status]!.compareTo(order[b.status]!);
      }
      return a.name.compareTo(b.name);
    });
    return members;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<_TeamMember>>(
      future: _load(),
      builder: (context, snap) {
        if (!snap.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        return Column(
          children: [
            _WeekNav(
              label: formatDayLong(day),
              sub: null,
              onPrev: () => onDay(-1),
              onNext: () => onDay(1),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
                itemCount: snap.data!.length,
                itemBuilder: (context, i) => _MemberRow(m: snap.data![i]),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _TeamMember {
  final String name;
  final bool isMine;
  final String status;
  final List<Map<String, dynamic>> shifts;
  final String? absenceName;
  final Color? absenceColor;
  _TeamMember({
    required this.name,
    required this.isMine,
    required this.status,
    required this.shifts,
    this.absenceName,
    this.absenceColor,
  });
}

class _MemberRow extends StatelessWidget {
  final _TeamMember m;
  const _MemberRow({required this.m});

  @override
  Widget build(BuildContext context) {
    Widget trailing;
    if (m.status == 'working') {
      trailing = Wrap(
        alignment: WrapAlignment.end,
        spacing: 4,
        runSpacing: 4,
        children: m.shifts.map((s) {
          final pos = s['positions'] as Map?;
          final color = _hex(pos?['color'] as String?) ?? emerald;
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '${trimSeconds(s['start_time'])}–${trimSeconds(s['end_time'])}',
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
          );
        }).toList(),
      );
    } else if (m.status == 'absence') {
      trailing = Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: (m.absenceColor ?? const Color(0xFF94A3B8))
              .withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          m.absenceName ?? 'Absence',
          style: TextStyle(
              color: m.absenceColor ?? kMutedForeground, fontSize: 12),
        ),
      );
    } else {
      trailing = const Text('Repos',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13));
    }

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: m.isMine ? emerald.withValues(alpha: 0.05) : Colors.white,
        border: Border.all(
          color: m.isMine ? emerald.withValues(alpha: 0.4) : kBorder,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              m.isMine ? '${m.name} (moi)' : m.name,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          const SizedBox(width: 8),
          Flexible(child: Align(alignment: Alignment.centerRight, child: trailing)),
        ],
      ),
    );
  }
}

// ── Barre de navigation (semaine/jour) partagée ─────────────────────────────

class _WeekNav extends StatelessWidget {
  final String label;
  final String? sub;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  const _WeekNav({
    required this.label,
    required this.sub,
    required this.onPrev,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          IconButton.outlined(
            onPressed: onPrev,
            icon: const Icon(Icons.chevron_left),
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                if (sub != null)
                  Text(sub!,
                      style: const TextStyle(
                          fontSize: 12, color: kMutedForeground)),
              ],
            ),
          ),
          IconButton.outlined(
            onPressed: onNext,
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }
}

/// Parse une couleur "#RRGGBB" en Color (sinon null).
Color? _hex(String? s) {
  if (s == null) return null;
  final h = s.replaceFirst('#', '');
  if (h.length != 6) return null;
  final v = int.tryParse(h, radix: 16);
  return v == null ? null : Color(0xFF000000 | v);
}
