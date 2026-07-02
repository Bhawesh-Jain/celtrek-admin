"use client"

import { Container } from "@/components/ui/container"
import { useState, useEffect } from "react"
import { collectCheckedPermissions, PermissionItem } from "@/lib/helpers/permission-helper";
import { getAllPermissions, getRoles, updateRolePermissions } from "@/lib/actions/sys/settings";
import RoleList from "./blocks/RoleList";
import PermissionTree from "./blocks/PermissionTree";
import Loading from "../../loading";
import { useToast } from "@/hooks/use-toast";
import EmptyList from "@/components/ui/empty-list";
import { Role } from "@/lib/repositories/sys/accessRepository";

export default function RoleSettings(

) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [reload, setReload] = useState(true);

  useEffect(() => {
    (async () => {
      setReload(false);
      setLoading(true);
      const rolesData = await getRoles();
      const permissionsData = await getAllPermissions();
      setRoles(rolesData.result);
      setPermissions(permissionsData.result);
      setSelectedRole(rolesData.result.find((role: Role) => role.id === selectedRole?.id) || null);
      setLoading(false);
    })();
  }, [reload]);

  const handleSaveChanges = async (updatedPermissions: PermissionItem[], e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    e.preventDefault();

    const permissions: number[] = collectCheckedPermissions(updatedPermissions);

    if (selectedRole) {
      const response = await updateRolePermissions(selectedRole.id, permissions);
      if (response.success) {
        toast({
          title: "Permissions updated successfully",
          description: "The permissions for the role have been updated successfully",
        });
        setSelectedRole(selectedRole);
        setReload(true);
      } else {
        toast({
          title: "Failed to update permissions",
          description: "The permissions for the role could not be updated",
          variant: "destructive"
        });
      }
    }
    setLoading(false);
  }

  return (
    <Container>
      {loading
        ? <Loading />
        : <div className="flex flex-col gap-4 md:flex-row border rounded-lg ">
          <div className="md:w-1/3 border-b md:border-r md:border-b-0">
            <RoleList setReload={setReload} roles={roles} selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
          </div>
          <div className="md:w-2/3">
            {selectedRole
              ? <PermissionTree permissions={permissions} selectedRole={selectedRole} handleSaveChanges={handleSaveChanges} />
              : <EmptyList text="No role selected" />}
          </div>
        </div>}
    </Container>
  );
}