import { hash } from "bcryptjs";

import { setSession } from "@/features/auth/session";
import { toCurrentUser } from "@/features/auth/user-mapper";
import {
  isUniqueConstraintError,
  registrationSchema,
} from "@/features/auth/validation";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { fail, ok } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return fail("AUTH_INVALID_INPUT", "Please check your registration details.", 400);
  }

  try {
    const prisma = getPrismaClient();
    const passwordHash = await hash(input.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.data.email,
        passwordHash,
        locale: input.data.locale,
        profile: {
          create: {
            displayName: input.data.displayName,
            nativeLanguage: input.data.locale,
          },
        },
      },
      include: { profile: true },
    });
    await setSession(user.id);
    return ok(toCurrentUser(user), 201);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return fail("AUTH_USER_EXISTS", "An account with this email already exists.", 409);
    }
    console.error("Unable to register user.", error);
    return fail("AUTH_SERVICE_UNAVAILABLE", "Authentication is temporarily unavailable.", 503);
  }
}
