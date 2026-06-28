import { NextResponse } from "next/server";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data, message },
    { status }
  );
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json<ApiResponse<null>>(
    { success: false, error },
    { status }
  );
}
