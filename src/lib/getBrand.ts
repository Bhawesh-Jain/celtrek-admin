import { resolveBrand } from "./resolveBrand"

export function getBrand() {
  if (typeof window !== "undefined") {
    return resolveBrand(window.location.hostname)
  }

  return resolveBrand()
}