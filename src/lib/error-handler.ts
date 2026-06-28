import { logger } from "./logger";
import { ZodError } from "zod";
import { errorResponse } from "./api-response";

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    logger.warn({ err: error }, "Validation error");
    return errorResponse("Validation failed", 400);
  }

  if (error instanceof Error) {
    logger.error({ err: error }, error.message);
    return errorResponse(error.message, 500);
  }

  logger.error({ err: error }, "Unknown error occurred");
  return errorResponse("Internal server error", 500);
}
