import { SessionOptions, getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers"
import { getBrand } from "./getBrand";

const brand = getBrand();

export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_KEY!, 
  cookieName: brand.companyNameMono,
  cookieOptions: {
    httpOnly: true,
    maxAge: 24 * 60 * 60, 
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), 
    secure: false
  }
}

export interface SessionData {
  user_id: string;
  user_phone: string;
  user_email: string;
  user_avatar: string;
  user_name: string;
  company_name: string;
  company_id: string;
  company_abbr: string;
  role: string;
  isLoggedIn: boolean;
}

// Create a type for validated session
export type ValidatedSession = Required<SessionData>;

export const defaultSession: SessionData = {
  user_id: '',
  user_phone: '',
  user_email: '', 
  user_avatar: '',
  user_name: '',
  company_name: '',
  company_id: '',
  company_abbr: '',
  role: '',
  isLoggedIn: false
}

export class SessionError extends Error {
  constructor(message: string = 'Invalid session') {
    super(message);
    this.name = 'SessionError';
  }
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

export async function validateSession(): Promise<ValidatedSession> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.user_id || !session.company_id) {
    throw new SessionError('User not authenticated');
  }

  return session as ValidatedSession;
}
