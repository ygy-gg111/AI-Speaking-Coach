import { getSessionUserId } from "@/features/auth/session";
import { toCurrentUser } from "@/features/auth/user-mapper";
import { profileUpdateSchema } from "@/features/auth/validation";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { fail, ok } from "@/lib/api-response";

export const runtime = "nodejs";

async function getAuthenticatedUser() {
  const userId = await getSessionUserId();
  if (!userId) {
    return null;
  }
  return getPrismaClient().user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    return user
      ? ok(toCurrentUser(user))
      : fail("AUTH_UNAUTHORIZED", "Please log in to continue.", 401);
  } catch (error) {
    console.error("Unable to load current user.", error);
    return fail("AUTH_SERVICE_UNAVAILABLE", "Authentication is temporarily unavailable.", 503);
  }
}

export async function PATCH(request: Request) {
  const input = profileUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return fail("PROFILE_INVALID_INPUT", "Please check your profile details.", 400);
  }

  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return fail("AUTH_UNAUTHORIZED", "Please log in to continue.", 401);
    }
    const user = await getPrismaClient().user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: input.data,
            update: input.data,
          },
        },
      },
      include: { profile: true },
    });
    return ok(toCurrentUser(user));
  } catch (error) {
    console.error("Unable to update user profile.", error);
    return fail("AUTH_SERVICE_UNAVAILABLE", "Profile update is temporarily unavailable.", 503);
  }
}
