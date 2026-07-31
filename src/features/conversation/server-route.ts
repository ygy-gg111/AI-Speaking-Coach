import { getSessionUserId } from "@/features/auth/session";
import { fail } from "@/lib/api-response";
import { DomainError } from "@/lib/domain-error";

export async function getRequiredUserId() {
  const userId = await getSessionUserId();
  return userId ?? fail("AUTH_UNAUTHORIZED", "Please log in to continue.", 401);
}

export function toDomainErrorResponse(error: unknown) {
  return error instanceof DomainError
    ? fail(error.code, error.message, error.status)
    : null;
}
