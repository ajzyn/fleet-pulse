export const logError = (err: unknown, context: Record<string, unknown> = {}): string => {
  const requestId = crypto.randomUUID();
  console.error(`[${requestId}]`, { ...context, error: err });
  return requestId;
};

export const sanitizeError = (err: unknown, context: Record<string, unknown> = {}): string => {
  const requestId = logError(err, context);
  return import.meta.env.DEV
    ? String(err instanceof Error ? (err.stack ?? err.message) : err)
    : `Nie udało się pobrać danych. Spróbuj ponownie później. ID błędu: ${requestId}`;
};
