import { compare } from "bcryptjs";

import { setSession } from "@/features/auth/session";
import { toCurrentUser } from "@/features/auth/user-mapper";
import { loginSchema } from "@/features/auth/validation";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { reportServerError } from "@/infrastructure/observability/logger";
import { fail, ok } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = loginSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return fail("AUTH_INVALID_INPUT", "Please check your email and password.", 400);
  }

  try {
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: input.data.email },
      include: { profile: true },
    });
    if (!user || !(await compare(input.data.password, user.passwordHash))) {
      return fail("AUTH_INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
    }
    await setSession(user.id);
    return ok(toCurrentUser(user));
  } catch (error) {
    reportServerError("auth.login_failed", "Unable to log in user.", error);
    return fail("AUTH_SERVICE_UNAVAILABLE", "Authentication is temporarily unavailable.", 503);
  }
}
