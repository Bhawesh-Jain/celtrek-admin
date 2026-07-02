export type Brand = {
  companyName: string
  companyNameMono: string
  companyNameSmall: string
  companyAbbr: string
  companyDesc: string
}

export const BRANDS: Record<string, Brand> = {
  default: {
    companyName: "Celtrek",
    companyNameMono: "Celtrek",
    companyNameSmall: "celtrek",
    companyAbbr: "CEL",
    companyDesc: `Admin Panel for Celtrek`,
  },
}