import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface UserAvatarProps {
  fullName: string;
  role?: UserRole;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

const ROLE_TINT: Record<UserRole, string> = {
  superadmin: "bg-primary/15 text-primary",
  admin: "bg-chart-1/15 text-chart-1",
  user: "bg-chart-2/15 text-chart-2",
};

/** Extract up to 2 uppercase initials from the user's full name. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Circular initials avatar tinted by user role. Reused on Account & Users table. */
export function UserAvatar({
  fullName,
  role,
  size = "md",
  className,
}: UserAvatarProps) {
  const tint = role ? ROLE_TINT[role] : "bg-muted text-muted-foreground";
  return (
    <Avatar className={cn(SIZE_CLASS[size], className)}>
      <AvatarFallback className={cn("font-semibold", tint)}>
        {initialsOf(fullName)}
      </AvatarFallback>
    </Avatar>
  );
}
