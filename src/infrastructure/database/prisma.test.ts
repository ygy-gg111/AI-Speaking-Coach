import { describe, expect, it } from "vitest";

import { createDatabaseAdapter, resolveDatabaseDriver } from "./prisma";

describe("database adapter selection", () => {
  it("uses MariaDB locally by default", () => {
    expect(resolveDatabaseDriver(undefined)).toBe("mariadb");
    expect(resolveDatabaseDriver("mariadb")).toBe("mariadb");
  });

  it("selects the TiDB Cloud serverless adapter explicitly", () => {
    expect(resolveDatabaseDriver("tidb-cloud")).toBe("tidb-cloud");
    expect(
      createDatabaseAdapter(
        "mysql://user:password@gateway01.us-west-2.prod.aws.tidbcloud.com/test",
        "tidb-cloud",
      ).constructor.name,
    ).toBe("PrismaTiDBCloudAdapterFactory");
  });

  it("rejects unsupported drivers and malformed database URLs", () => {
    expect(() => resolveDatabaseDriver("mysql")).toThrow(/DATABASE_DRIVER/);
    expect(() =>
      createDatabaseAdapter("postgresql://localhost/test", "mariadb"),
    ).toThrow(/mysql:\/\//);
    expect(() =>
      createDatabaseAdapter("mysql://localhost", "tidb-cloud"),
    ).toThrow(/database name/);
  });
});
