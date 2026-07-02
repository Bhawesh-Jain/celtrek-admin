'use client'

import { UserData } from "@/lib/actions/sys/auth";
import { createContext, useContext } from "react";


interface UserContextType {
  user: UserData;
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children, user }: { children: React.ReactNode, user: UserData } ) {
  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}