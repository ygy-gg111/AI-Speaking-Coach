import { fail, ok } from "@/lib/api-response";
import { getPrismaClient } from "@/infrastructure/database/prisma";

export async function GET() {
  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
    const response = ok({
      service: "ai-speaking-coach",
      status: "ok",
      database: "ok",
      timestamp: new Date().toISOString(),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return fail("HEALTH_DATABASE_UNAVAILABLE", "Database health check failed.", 503);
  }
}
