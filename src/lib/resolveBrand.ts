export type Brand = {
  companyName: string
  companyNameMono: string
  companyNameSmall: string
  companyAbbr: string
  companyDesc: string
}

const DEFAULT_BRAND: Brand = {
    companyName: "Celtrek",
    companyNameMono: "Celtrek",
    companyNameSmall: "celtrek",
    companyAbbr: "CEL",
    companyDesc: `Admin Panel for Celtrek`,
}

export function resolveBrand(hostname?: string): Brand {
  const host = hostname?.toLowerCase().trim() ?? ""

  return DEFAULT_BRAND
}