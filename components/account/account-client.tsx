"use client";

import { KeyRound, UserCircle } from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ActivityRow } from "@/lib/actions/activity-logs.actions";
import type { UserRole, UserStatus } from "@/lib/types";
import { AccountMetaCard } from "./account-meta-card";
import { ActivityLogCard } from "./activity-log-card";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileCard } from "./profile-card";
import { SecurityTipsCard } from "./security-tips-card";
import { SessionInfoCard } from "./session-info-card";

interface AccountClientProps {
  nik: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  issuedAt: number;
  expiresAt: number;
  activity: ActivityRow[];
}

type TabValue = "profile" | "security";

/** Account page — Tabs (Profil / Keamanan), persisted via ?tab= URL param. */
export function AccountClient(props: AccountClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get("tab");
  const tab: TabValue = raw === "security" ? "security" : "profile";

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "profile") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-6">
      <TabsList className="h-10 border bg-card p-1">
        <TabsTrigger value="profile" className="gap-1.5 px-4 py-1.5">
          <UserCircle className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-1.5 px-4 py-1.5">
          <KeyRound className="h-4 w-4" />
          Security
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-0 space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <ProfileCard
            className="lg:col-span-2"
            nik={props.nik}
            fullName={props.fullName}
            role={props.role}
            status={props.status}
          />
          <AccountMetaCard
            lastLoginAt={props.lastLoginAt}
            createdAt={props.createdAt}
            status={props.status}
          />
        </div>
        <ActivityLogCard rows={props.activity} />
      </TabsContent>

      <TabsContent value="security" className="mt-0">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-md bg-primary/15 p-1.5 text-primary">
                  <KeyRound className="h-4 w-4" />
                </div>
                <CardTitle className="text-base">Change Password</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure the new password meets all requirements below.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <ChangePasswordForm embedded />
            </CardContent>
          </Card>
          <div className="space-y-4">
            <SessionInfoCard
              issuedAt={props.issuedAt}
              expiresAt={props.expiresAt}
            />
            <SecurityTipsCard />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
