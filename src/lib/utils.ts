import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function customLog(message?: any, ...optionalParams: any[]) {
  console.dir({ message, optionalParams }, { depth: 100 })
}

export function getStatusColor(status: string) {
  var s = status.toString().trim();
  switch (s) {
    case "-10":
      return "text-destructive";
    case "-1":
      return "text-destructive";
    case "0":
      return "text-destructive";
    case "1":
      return "text-primary";
    case "10":
      return "text-warning";
    case "50":
      return "text-info";
    case "100":
      return "text-success";
    default:
      return "";
  }
}
