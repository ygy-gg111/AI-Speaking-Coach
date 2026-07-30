import { clearSession } from "@/features/auth/session";
import { ok } from "@/lib/api-response";

export async function POST() {
  await clearSession();
  return ok({ loggedOut: true as const });
}
