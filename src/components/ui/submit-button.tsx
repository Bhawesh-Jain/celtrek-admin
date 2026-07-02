'use client'
 
import { Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { Button } from './button'
 
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
 
  return (
    <Button disabled={pending} type="submit" variant="default" className="flex items-center gap-2">
      {pending && <Loader2 className="w-4 h-4 ml-2" />}
      {pending ? 'Loading...' : children}
    </Button>
  )
}