import { getSessionUserId } from "@/features/auth/session";
import { toCurrentUser } from "@/features/auth/user-mapper";
import { preferencesUpdateSchema } from "@/features/auth/validation";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const input = preferencesUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!input.success) {
    return fail(
      "PREFERENCES_INVALID_INPUT",
      "Please check your preference settings.",
      400,
    );
  }

  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return fail("AUTH_UNAUTHORIZED", "Please log in to continue.", 401);
    }
    const { speed, ...preferences } = input.data;
    const user = await getPrismaClient().user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: { ...preferences, speechSpeed: speed },
            update: { ...preferences, speechSpeed: speed },
          },
        },
      },
      include: { profile: true },
    });
    return ok(toCurrentUser(user));
  } catch (error) {
    reportServerError(
      "preferences.update_failed",
      "Unable to update user preferences.",
      error,
    );
    return fail(
      "PREFERENCES_SERVICE_UNAVAILABLE",
      "Preference settings are temporarily unavailable.",
      503,
    );
  }
}
