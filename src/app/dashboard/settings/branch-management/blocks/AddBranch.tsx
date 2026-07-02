'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form";
import { createBranch, createRole } from "@/lib/actions/sys/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/dashboard/loading";
import { useState } from "react";
import { DefaultFormTextField, DefaultFormTextArea } from "@/components/ui/default-form-field";
import { useUser } from "@/contexts/user-context";

export interface Branch {
  id: number;
  name: string;
  branch_code: string;
  pincode: string;
  location: string;
}
const formScheme = z.object({
  name: z.string().min(2, "Add a role name").max(255, "Role name must be less than 255 characters"),
  location: z.string().max(150, "Location must be less than 150 characters"),
  pincode: z.string().max(10, "Pincode must be less than 10 characters"),
  branch_code: z.string().max(50, "Branch code must be less than 50 characters").optional(),
});

export type FormValues = z.infer<typeof formScheme>;


export default function AddBranch({
  setReload,
  branch
}: {
  setReload: (reload: boolean) => void,
  branch?: Branch | null
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const defaultValues: Partial<FormValues> = {
    name: "",
    branch_code: `${user.company_abbr}-`,
    location: "",
    pincode: "",
  };

  async function onSubmit(data: FormValues) {
    setLoading(true);

    const result = await createBranch(data.name, data.branch_code || '', data.pincode || '', data.location || '')

    setLoading(false);
    if (result.success) {
      toast({
        title: "Branch created successfully",
        description: "The branch has been created successfully",
      })
      form.reset();
      setOpen(false);
      setReload(true);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      })
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formScheme),
    defaultValues,
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Branch</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Branch</DialogTitle>
          <DialogDescription>
            Add a new branch to the system
          </DialogDescription>
        </DialogHeader>
        <div className="my-3">
          {loading ? <Loading /> : <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DefaultFormTextField
                  label="Branch Name"
                  form={form}
                  placeholder="Enter branch name"
                  name="name"
                />
                <DefaultFormTextField
                  label="Branch Code"
                  form={form}
                  placeholder="Enter branch code"
                  name="branch_code"
                />
                <DefaultFormTextField
                  label="Pincode"
                  form={form}
                  placeholder="Enter branch pincode"
                  name="pincode"
                />
              </div>
              <DefaultFormTextArea
                label="Location"
                form={form}
                placeholder="Enter branch location"
                name="location"
              />

              <div className="flex justify-end">
                <Button type="submit">Add Branch</Button>
              </div>
            </form>
          </Form>}
        </div>
      </DialogContent>
    </Dialog>
  )
}