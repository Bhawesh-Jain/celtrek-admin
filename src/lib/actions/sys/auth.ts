"use server"
import { getSession } from "../../session";
import { UserAuthRepository } from "../../repositories/sys/userAuthRepository";
import { cookies } from "next/headers";
import { customLog } from "../../utils";

export type UserData = {
  user_id: string;
  user_phone: string;
  user_email: string;
  user_avatar: string;
  user_name: string;
  company_name: string;
  company_id: string;
  company_abbr: string;
  role: string;
};


export async function handleLoginForm(formData: FormData) {
  const formObject = Object.fromEntries(formData.entries());

  const ip = cookies().get('client-ip')?.value || 'undefined';

  let { username, password } = formObject;

  try {
    const authService = new UserAuthRepository();

    const result = await authService.login(username.toString().trim(), password.toString(), ip.toString(), 10);

    if (result.success) {
      if (result.user == null) {
        throw new Error("Invalid User!");
      }

      await login(result.user);

      return {
        success: true,
        message: "Login Succesfull!"
      }
    } else {
      return {
        success: false,
        message: result.message
      }
    }
  } catch (error) {
    customLog('auth.ts', error);

    return {
      success: false,
      message: "Login Request Not Processed!"
    };
  }
}

export async function login(userData: UserData) {
  const session = await getSession();

  Object.assign(session, {
    ...userData,
    isLoggedIn: true,
  });

  await session.save();
}

export async function logout() {
  const session = await getSession();
  session.destroy();
}