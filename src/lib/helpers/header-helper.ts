import { cookies } from "next/headers";

export function getDeviceIp() {
  return cookies().get('client-ip')?.value || 'undefined';
}

export function getDeviceInfo() {
  return cookies().get('device-info')?.value || 'undefined';
}