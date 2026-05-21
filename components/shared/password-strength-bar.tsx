import { cn } from "@/lib/utils";

/** Score a password 0–4 for the strength meter. */
export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw) || pw.length >= 12) score++;
  return score;
}

const LABELS = ["", "Lemah", "Sedang", "Kuat", "Sangat Kuat"];
const COLORS = ["", "bg-chart-4", "bg-chart-3", "bg-chart-2", "bg-chart-2"];

/** 4-segment password strength meter (Account / Change Password). */
export function PasswordStrengthBar({ password }: { password: string }) {
  const score = scorePassword(password);
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              seg <= score ? COLORS[score] : "bg-muted",
            )}
          />
        ))}
      </div>
      {score > 0 && (
        <p className="text-xs text-muted-foreground">{LABELS[score]}</p>
      )}
    </div>
  );
}
