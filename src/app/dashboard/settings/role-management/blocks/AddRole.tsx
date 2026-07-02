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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createRole } from "@/lib/actions/sys/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/dashboard/loading";
import { useState } from "react";

const formScheme = z.object({
  name: z.string().min(2, "Add a role name").max(255, "Role name must be less than 255 characters"),
  department: z.string().max(255, "Department name must be less than 255 characters").optional(),
});

export type FormValues = z.infer<typeof formScheme>;

const defaultValues: Partial<FormValues> = {
  name: "",
  department: "",
};

export default function AddRole({
  setReload
}: {
  setReload: (reload: boolean) => void
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function onSubmit(data: FormValues) {
    setLoading(true);
    const result = await createRole(data.name, data.department || '')
    setLoading(false);
    if (result.success) {
      toast({
        title: "Role created successfully",
        description: "The role has been created successfully",
      })
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
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Role</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
          <DialogDescription>
            Add a new role to the system
          </DialogDescription>
        </DialogHeader>
        <div className="my-3">
          {loading ? <Loading /> : <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter role name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter department name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit">Add Role</Button>
              </div>
            </form>
          </Form>}
        </div>
      </DialogContent>
    </Dialog>
  )
}