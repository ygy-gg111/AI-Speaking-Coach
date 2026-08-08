import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";

export type DatabaseDriver = "mariadb" | "tidb-cloud";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for database access.");
  }

  const prisma = new PrismaClient({
    adapter: createDatabaseAdapter(
      connectionString,
      resolveDatabaseDriver(process.env.DATABASE_DRIVER),
    ),
  });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
  return prisma;
}

export function resolveDatabaseDriver(value: string | undefined): DatabaseDriver {
  if (!value || value === "mariadb") return "mariadb";
  if (value === "tidb-cloud") return value;
  throw new Error("DATABASE_DRIVER must be mariadb or tidb-cloud.");
}

export function createDatabaseAdapter(
  connectionString: string,
  driver: DatabaseDriver,
) {
  validateMySqlUrl(connectionString);
  if (driver === "tidb-cloud") {
    return new PrismaTiDBCloud({ url: connectionString });
  }

  const url = new URL(connectionString);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: Number(url.searchParams.get("connection_limit") || 5),
  });
}

function validateMySqlUrl(connectionString: string) {
  const url = new URL(connectionString);
  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must use the mysql:// protocol.");
  }
  if (!decodeURIComponent(url.pathname.replace(/^\//, ""))) {
    throw new Error("DATABASE_URL must include a database name.");
  }
}
