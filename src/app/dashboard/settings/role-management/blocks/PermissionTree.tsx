"use client"

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { PermissionItem } from "@/lib/helpers/permission-helper";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils"
import { SubmitButton } from "@/components/ui/submit-button";
import { Role } from "@/lib/repositories/sys/accessRepository";
import { Button } from "@/components/ui/button";

export default function PermissionTree({
  permissions,
  selectedRole,
  handleSaveChanges
}: {
  permissions: PermissionItem[],
  selectedRole: Role,
  handleSaveChanges: (updatedPermissions: PermissionItem[], e: React.FormEvent<HTMLFormElement>) => void
}) {
  const rolePermissions = selectedRole.permissions.split(',').map(id => parseInt(id));
  const [updatedPermissions, setUpdatedPermissions] = useState<PermissionItem[]>([]);

  const initializePermissions = (perms: PermissionItem[]): PermissionItem[] => {
    return perms.map((perm) => ({
      ...perm,
      checked: rolePermissions.includes(perm.id),
      items: perm.items ? initializePermissions(perm.items) : undefined
    }));
  };

  useEffect(() => {
    setUpdatedPermissions(initializePermissions(permissions));
  }, [permissions, selectedRole]);

  const handleCheckboxChange = (id: number, checked: boolean) => {
    const updatePermission = (perms: PermissionItem[]): PermissionItem[] => {
      return perms.map((perm) => {
        if (perm.id === id) {
          return { ...perm, checked };
        }
        return {
          ...perm,
          items: perm.items ? updatePermission(perm.items) : undefined
        };
      });
    };

    setUpdatedPermissions(prev => updatePermission(prev));
  };

  const handleSelectAllChildren = (parentId: number) => {
    const updatePermissions = (perms: PermissionItem[]): PermissionItem[] => {
      return perms.map(perm => {
        if (perm.id === parentId) {
          var newC = !perm.checked
          const updateChildren = (items: PermissionItem[]): PermissionItem[] =>
            items.map(item => ({
              ...item,
              checked: newC,
              items: item.items ? updateChildren(item.items) : undefined
            }));
          return {
            ...perm,
            checked: newC,
            items: perm.items ? updateChildren(perm.items) : undefined
          };
        }
        return {
          ...perm,
          items: perm.items ? updatePermissions(perm.items) : undefined
        };
      });
    };

    setUpdatedPermissions(prev => updatePermissions(prev));
  };

  const renderPermissions = (perms: PermissionItem[], level = 0) => {
    return perms.map((perm, index) => {
      const isLast = index === perms.length - 1;
      const hasChildren = perm.items && perm.items.length > 0;

      return (
        <div key={perm.id} className={cn(
          "relative",
          level > 0 && "ml-8",
        )}>
          {level > 0 && (
            <div className="absolute -left-4 top-0 h-full w-6">
              <div className="absolute left-0 -top-[1px] h-5 w-6 border-l-2 border-gray-200" />
              {!isLast && <div className="absolute left-0 top-0 h-full border-l-2 border-gray-200" />}
              {<div className="absolute left-0 top-[1.2rem] h-0.5 w-5 bg-gray-200" />}
            </div>
          )}

          <div className="flex justify-between">
            <div className={cn(
              "relative flex items-center gap-2 rounded-lg border border-transparent p-2",
              "hover:bg-accent/50 hover:border-accent",
              "transition-colors duration-200"
            )}>
              <Checkbox
                id={perm.id.toString()}
                checked={perm.checked}
                onCheckedChange={(checked) => handleCheckboxChange(perm.id, checked === true)}
                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <label
                htmlFor={perm.id.toString()}
                className="flex-1 cursor-pointer text-sm">
                {perm.title}
              </label>
            </div>

            {hasChildren && (
              <Button
                size='sm'
                variant='outline'
                type="button"
                onClick={() => handleSelectAllChildren(perm.id)}
              >
                All
              </Button>
            )}
          </div>

          {hasChildren && (
            <div className="relative mt-1">
              {renderPermissions(perm.items!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <Container className="p-6">
      <form onSubmit={(e) => handleSaveChanges(updatedPermissions, e)}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{selectedRole.role_name} Permissions</h2>
          <SubmitButton>
            Save Changes
          </SubmitButton>
        </div>
        <div className="">
          {renderPermissions(updatedPermissions)}
        </div>
      </form>
    </Container>
  );
}