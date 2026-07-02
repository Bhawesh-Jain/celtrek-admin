import { NextResponse } from "next/server";
import { customLog } from "../utils";

export const DEFAULT_COMPANY_ID = '1';

export function apiValidate({
  origin,
  req,
  header
}: {
  origin?: string,
  req?: any
  header?: any
}) {
  // customLog(`[${origin}]`, header, req)
  return ({ success: true, message: ['Request Validated'], })
}

export function apiSuccess({
  data,
  message = ['Request Successful']
}: {
  data?: any,
  message?: string[]
}) {
  return NextResponse.json({ success: true, message, data }, { status: 200 })
}

export function apiFailure({
  message = ['Request Failed'],
  status = 400
}: {
  message?: string[],
  status?: 400 | 401 | 500
}) {
  return NextResponse.json({ success: false, message }, { status: status })
}

export function apiError({
  origin,
  error,
  message = ['Server Error'],
  status = 500
}: {
  origin: string,
  error: any,
  message?: string[],
  status?: 200 | 500
}) {
  customLog(origin, error);
  return NextResponse.json({ success: false, message }, { status: status })
} 