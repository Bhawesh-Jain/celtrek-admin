'use client'

import { LoginForm } from "@/app/login/blocks/login-form"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { getBrand } from "@/lib/getBrand"

export default function LoginPage() {
  const brand = getBrand()

  return (
    <div className="grid min-h-svh lg:grid-cols-12 lg:p-8 bg-[#1E1E1E]">
      <div className="hidden bg-[url(/assets/login-bg-gradient.svg)] bg-cover justify-center h-full lg:flex flex-col px-[10%] col-span-7 gap-5">
        <span className="text-4xl font-semibold text-primary-foreground">Welcome to {brand.companyName}</span>
        <span className="text-base text-muted-foreground">Admin panel for {brand.companyNameSmall} app</span>
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-10  col-span-5 bg-muted shadow-lg">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <Avatar className="flex h-6 w-6 items-center justify-center rounded-md">
              <AvatarImage src="/assets/logo.png" alt="Logo" />
            </Avatar>
            {brand.companyName}
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs lg:max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
