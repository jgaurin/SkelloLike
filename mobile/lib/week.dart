import 'package:intl/intl.dart';

/// Utilitaires de semaine — port du `src/lib/week.ts` du web.
/// Semaine = lundi → dimanche (convention FR / Skello).
/// Dates manipulées en chaîne ISO "YYYY-MM-DD" pour éviter les décalages TZ.

const weekdaysShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

String toIso(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

DateTime fromIso(String s) {
  final p = s.split('-').map(int.parse).toList();
  return DateTime(p[0], p[1], p[2], 12);
}

/// Lundi de la semaine contenant [date].
String getMonday([DateTime? date]) {
  final base = date ?? DateTime.now();
  var d = DateTime(base.year, base.month, base.day);
  final dow = (d.weekday + 6) % 7; // 0 = lundi … 6 = dimanche
  d = d.subtract(Duration(days: dow));
  return toIso(d);
}

/// Les 7 dates ISO de la semaine commençant à [monday].
List<String> weekDates(String monday) {
  final base = fromIso(monday);
  return List.generate(7, (i) => toIso(base.add(Duration(days: i))));
}

/// Décale une semaine de [weeks] (+/-).
String shiftWeek(String monday, int weeks) =>
    getMonday(fromIso(monday).add(Duration(days: weeks * 7)));

/// Décale un jour ISO de [days].
String shiftDay(String iso, int days) =>
    toIso(fromIso(iso).add(Duration(days: days)));

bool isToday(String iso) => iso == toIso(DateTime.now());

/// "HH:MM:SS" -> "HH:MM".
String trimSeconds(String time) => time.length >= 5 ? time.substring(0, 5) : time;

int _timeToMinutes(String time) {
  final p = time.split(':').map(int.parse).toList();
  return p[0] * 60 + p[1];
}

/// Durée travaillée d'un shift en heures (pauses déduites, gère la nuit).
double shiftHours(String start, String end, [int breakMinutes = 0]) {
  var mins = _timeToMinutes(end) - _timeToMinutes(start);
  if (mins < 0) mins += 24 * 60;
  mins -= breakMinutes;
  return (mins < 0 ? 0 : mins) / 60;
}

/// Libellé d'une plage de semaine, ex. "2 – 8 juin 2026".
String formatWeekRange(String monday) {
  final dates = weekDates(monday);
  final start = fromIso(dates[0]);
  final end = fromIso(dates[6]);
  final dayFmt = DateFormat('d', 'fr_FR');
  final fullFmt = DateFormat('d MMMM yyyy', 'fr_FR');
  if (start.month == end.month) {
    return '${dayFmt.format(start)} – ${fullFmt.format(end)}';
  }
  final startFmt = DateFormat('d MMMM', 'fr_FR');
  return '${startFmt.format(start)} – ${fullFmt.format(end)}';
}

/// Libellé long d'un jour, ex. "lundi 16 juin".
String formatDayLong(String iso) =>
    DateFormat('EEEE d MMMM', 'fr_FR').format(fromIso(iso));
