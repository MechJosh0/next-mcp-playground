export const log = (
  level: "info" | "warn" | "error",
  message: string,
  data?: any
): void => {
  if (process.env.NODE_ENV !== "test") {
    const timestamp = new Date().toISOString().slice(11, 19).replace("T", " ");
    const logMessage = `[SERVER] [${timestamp}] [${level.toUpperCase()}] ${message}`;

    console.error(logMessage, data ? JSON.stringify(data) : "");
  }
};
