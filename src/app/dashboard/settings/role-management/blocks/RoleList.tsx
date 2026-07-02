"use client"

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import AddRole from "./AddRole";
import { Role } from "@/lib/repositories/sys/accessRepository";

export default function RoleList({
  roles,
  selectedRole,
  setSelectedRole,
  setReload
}: {
  roles: Role[],
  selectedRole: Role | null,
  setSelectedRole: (role: Role) => void,
  setReload: (reload: boolean) => void
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoles = roles.filter((role: Role) =>
    role.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClickRole = (role: Role) => {
    setSelectedRole(role);
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex justify-between items-center gap-5">
        <Input
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow max-w-md"
        />
        <AddRole setReload={setReload} />
      </div>
      <ul className="mt-2 text-sm border rounded-lg">
        {filteredRoles.map((role: Role, index: number) => (
          <li
            onClick={() => handleClickRole(role)}
            key={role.id}
            className={cn(
              "flex justify-between items-center gap-5 py-2 p-3 shadow-sm cursor-pointer hover:shadow-md hover:bg-muted",
              selectedRole?.id === role.id && "bg-muted",
              index > 0 && 'border-t'
            )}
          >
            <span className="font-medium">{role.role_name}<span className="text-muted-foreground"> {role.department.length > 0 && '-'} {role.department}</span></span>
            <span className="text-sm text-muted-foreground text-nowrap">{role.user_count} User{role.user_count > 1 ? 's' : ''}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}