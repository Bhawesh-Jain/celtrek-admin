export type Brand = {
  companyName: string
  companyNameMono: string
  companyNameSmall: string
  companyAbbr: string
  companyDesc: string
}

const DEFAULT_BRAND: Brand = {
  companyName: "Early Triumph Motorcycle Parts",
  companyNameMono: "EarlyTriumphMotorcycleParts",
  companyNameSmall: "early triumph motorcycle parts",
  companyAbbr: "ETMP",
  companyDesc: `Admin Panel for Early Triumph Motorcycle Parts`,
}

const STIMEX_BRAND: Brand = {
  companyName: "Stimex Engineers",
  companyNameMono: "StimexEngineers",
  companyNameSmall: "stimex engineers",
  companyAbbr: "STE",
  companyDesc: `Admin Panel for Stimex Engineers`,
}

const DIVINE_BRAND: Brand = {
  companyName: "Divine Global",
  companyNameMono: "DivineGlobal",
  companyNameSmall: "divine global",
  companyAbbr: "DGL",
  companyDesc: `Admin Panel for Divine Global`,
}

export function resolveBrand(hostname?: string): Brand {
  const host = hostname?.toLowerCase().trim() ?? ""

  if (host.endsWith("stimaxinfra.com")) {
    return STIMEX_BRAND
  }

  if (host.match("divineadmin.techplusconsultancy.com")) {
    return DIVINE_BRAND
  }

  return DEFAULT_BRAND
}