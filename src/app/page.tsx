import { validateSession } from '@/lib/session';
import { redirect } from 'next/navigation'

export default async function Home() {
  try {
    const session = await validateSession();
    if (session.isLoggedIn) {
      redirect('/dashboard')
    } else
      redirect('/login')
  } catch (error) {
    redirect('/login')
  }
}
