import { getEmployeeContext } from "@/lib/auth/employee-context";
import { ProfilSection } from "../profil-section";

export default async function ProfilPage() {
  const ctx = await getEmployeeContext();
  return <ProfilSection ctx={ctx} />;
}
