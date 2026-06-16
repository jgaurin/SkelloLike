import 'package:supabase_flutter/supabase_flutter.dart';

final supabase = Supabase.instance.client;

/// Contexte de l'employé connecté — équivalent de getEmployeeContext() du web.
class EmployeeContext {
  final String employeeId;
  final String orgName;
  final String fullName;
  final String firstName;
  final String? email;
  final String? phone;
  final String? hireDate;
  final String? avatarUrl;
  final String? pinCode;

  EmployeeContext({
    required this.employeeId,
    required this.orgName,
    required this.fullName,
    required this.firstName,
    this.email,
    this.phone,
    this.hireDate,
    this.avatarUrl,
    this.pinCode,
  });
}

/// Charge le contexte de l'utilisateur connecté : son membership (org) et sa
/// fiche employé. Renvoie null si l'utilisateur n'est pas un employé rattaché.
Future<EmployeeContext?> loadEmployeeContext() async {
  final user = supabase.auth.currentUser;
  if (user == null) return null;

  final membership = await supabase
      .from('memberships')
      .select('org_id, role, organizations(name)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

  if (membership == null) return null;
  if (membership['role'] != 'employee') return null;

  final emp = await supabase
      .from('employees')
      .select(
          'id, first_name, last_name, email, phone, hire_date, avatar_url, pin_code')
      .eq('user_id', user.id)
      .maybeSingle();

  if (emp == null) return null;

  final orgName =
      (membership['organizations'] as Map?)?['name'] as String? ?? 'Mon entreprise';
  final first = emp['first_name'] as String? ?? '';
  final last = emp['last_name'] as String? ?? '';

  return EmployeeContext(
    employeeId: emp['id'] as String,
    orgName: orgName,
    fullName: '$first $last'.trim(),
    firstName: first,
    email: emp['email'] as String? ?? user.email,
    phone: emp['phone'] as String?,
    hireDate: emp['hire_date'] as String?,
    avatarUrl: emp['avatar_url'] as String?,
    pinCode: emp['pin_code'] as String?,
  );
}

/// Initiales (2 lettres) pour l'avatar.
String initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
  return parts.take(2).map((p) => p[0].toUpperCase()).join();
}
