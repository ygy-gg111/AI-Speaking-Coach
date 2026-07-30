export type ClientErrorPayload = {
  name: string;
  message: string;
  stack?: string;
  digest?: string;
  path: string;
  locale: string;
};

export function reportClientError(payload: ClientErrorPayload) {
  return fetch("/api/v1/telemetry/client-errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    keepalive: true,
  }).catch(() => undefined);
}
