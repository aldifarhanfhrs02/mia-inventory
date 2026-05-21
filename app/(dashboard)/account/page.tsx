import { PageHeader } from "@/components/shared/page-header";

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Account" subtitle="Profil dan keamanan akun" />
      <p className="text-sm text-muted-foreground">
        Profile and change-password arrive in Phase 10.
      </p>
    </>
  );
}
