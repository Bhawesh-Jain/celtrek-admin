import { Container } from "@/components/ui/container";
import { Column, DataTable } from "@/components/data-table/data-table";
import { disableUser, getUsersByRoleId } from "@/lib/actions/sys/settings";
import { User } from "@/lib/repositories/sys/userRepository";
import { useEffect, useState } from "react";
import { Heading, Paragraph, SubHeading } from "@/components/text/heading";
import { Role } from "@/lib/repositories/sys/accessRepository";
import AddUser from "./AddUser";
import formatDate from "@/lib/utils/date";
import { getUserDisplayClass, getUserStatus } from "@/lib/utils/user";
import { cn } from "@/lib/utils";
import { Button, ButtonTooltip } from "@/components/ui/button";
import { Edit2, Lock } from "lucide-react";
import EditUser from "./EditUser";

export default function UserList({
  role
}: {
  role: Role,
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(true);
  const [addUser, setAddUser] = useState(false);
  const [formType, setFormType] = useState('');
  const [currentId, setCurrentId] = useState(0);

  useEffect(() => {
    (async () => {
      setReload(false);
      setLoading(true);
      const usersData = await getUsersByRoleId(role.id);
      setUsers(usersData.result);
      setLoading(false);
    })();
  }, [reload, role.id]);

  const columns: Column<User>[] = [

    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      visible: true,
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      visible: true,
    },
    {
      id: "phone",
      header: "Phone",
      accessorKey: "phone",
      visible: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      visible: true,
      sortable: true,
      cell: (row) => {
        const userClass = getUserDisplayClass(row.status);
        return <div className={cn(userClass, '')}>{getUserStatus(row.status)}</div>
      },
    },
    {
      id: "last_login",
      header: "Last Login",
      accessorKey: "last_login",
      cell: (row) => {
        if (row.last_login) {
          return formatDate(row.last_login.toString(), 'dd-MM-yyyy hh:mm a');
        } else {
          return "N/A";
        }
      },
      visible: true,
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      accessorKey: "id",
      visible: true,
      align: "right",
      cell: (row) => {
        return <div className="flex gap-2 justify-end">
           <ButtonTooltip title={"Edit User"} onClick={() => handleEditUser(row.id)} variant={"ghost"} size="icon">
            <Edit2 className={cn("text-green-500")} />
          </ButtonTooltip>
          <ButtonTooltip title={"Disable User"} onClick={() => handleDisableUser(row.id, row.status <= 0 ? 1 : -1)} variant={"ghost"} size="icon">
            <Lock className={cn(row.status <= 0 ? "text-green-500" : "text-red-500")} />
          </ButtonTooltip>
        </div>
      },
    }
  ]

  const handleDisableUser = async (id: number, status: number) => {
    const result = await disableUser(id, status);
    if (result.success) {
      setReload(true);
    }
  }

  const handleEditUser = async (id: number) => {
    setCurrentId(id)
    openForm('edit', true)
  }

  function openForm(type: string, vis: boolean) {
    setFormType(type)
    setAddUser(vis)
  }

  return (
    <Container className="flex flex-col gap-4">
      <div className="flex gap-2 justify-between items-center">
        <div className="flex flex-col">
          <Heading>User List</Heading>
          <Paragraph>List of {role.role_name} users</Paragraph>
        </div>
        {addUser
          ? <Button variant={"outline"} onClick={() => openForm('add', false)}>Close</Button>
          : <Button onClick={() => openForm('add', true)}>Add User</Button>
        }
      </div>
      {addUser
        ? <>
          {formType === 'add' && <AddUser setReload={setReload} setAddUser={(bool) => openForm('add', bool)} currentRole={role} />}
          {formType === 'edit' && <EditUser setReload={setReload} setEditUser={(bool) => openForm('edit', bool)} currentId={currentId} currentRole={role} />}
        </>
        : <DataTable data={users} columns={columns} loading={loading} setReload={setReload} />
      }
    </Container>
  )
}
