"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import type { ActivityAction, EntityType } from "@/lib/types";

export interface ActivityRow {
  id: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string | null;
  createdAt: Date;
}

/** Last N activity log entries authored by the current user (newest first). */
export async function getMyRecentActivity(limit = 10): Promise<ActivityRow[]> {
  const session = await getServerSession();
  if (!session) return [];

  const rows = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .where(eq(activityLogs.userId, session.user.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);

  return rows;
}
