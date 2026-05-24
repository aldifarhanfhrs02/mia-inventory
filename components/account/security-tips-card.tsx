import { Check, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TIPS = [
  "Use a password with at least 8 characters combining letters and numbers.",
  "Never share your password with anyone, including admins.",
  "Change your password regularly, every 3–6 months.",
  "Session expires automatically after 8 hours of inactivity.",
] as const;

/** Sidekick card on the Keamanan tab — static security tips list. */
export function SecurityTipsCard() {
  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-md bg-chart-2/15 p-1.5 text-chart-2">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">Security Tips</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Best practices to keep your account secure.
        </p>
      </CardHeader>
      <CardContent className="pt-5">
        <ul className="space-y-3">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-chart-2/15 text-chart-2">
                <Check className="h-3 w-3" />
              </span>
              <span className="text-muted-foreground">{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
