/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { decryptIdFromUrl } from "@/lib/utils/crypto";
import {
  getLeadById,
  updateLeadStatus,
  addLeadActivity,
} from "@/lib/actions/lead";
import { useToast } from "@/hooks/use-toast";
import formatDate from "@/lib/utils/date";
import Loading from "@/app/dashboard/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Mail,
  Building2,
  Package,
  Clock,
  MessageSquare,
  ArrowLeft,
  PhoneCall,
  Send,
  User,
} from "lucide-react";
import { getUserList } from "@/lib/actions/user";
import { assignLead } from "@/lib/actions/lead";

import Image from "next/image";
import { ExternalLink, AlertTriangle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-blue-100 text-blue-700" },
  contacted: { label: "Contacted", className: "bg-amber-100 text-amber-700" },
  qualified: { label: "Qualified", className: "bg-purple-100 text-purple-700" },
  converted: { label: "Converted", className: "bg-green-100 text-green-700" },
  lost: { label: "Lost", className: "bg-gray-100 text-gray-500" },
};

const ACTIVITY_ICON: Record<string, any> = {
  note: MessageSquare,
  status_change: Clock,
  call: PhoneCall,
  email: Mail,
  assignment: Send,
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const leadId = decryptIdFromUrl(params.id as string);

  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState("");
  const [activityType, setActivityType] = useState<"note" | "call" | "email">(
    "note",
  );
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      const result = await getUserList();
      if (result.success) {
        const userList = result.result;

        userList.map((user: any) => {
          user.name = `${user.name} (${user.role_name})`;
          return user;
        });

        setUsers(userList);
      }
    })();
  }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const result = await getLeadById(String(leadId));
      if (result.success) {
        setLead(result.result);
      } else {
        toast({
          title: "Error",
          description: "Could not load this lead.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [leadId]);

  const handleAssign = async (userId: string) => {
    const previous = lead.assigned_to;
    const previousName = lead.assigned_to_name;
    const matchedUser = users.find((u) => String(u.id) === userId);

    setLead((prev: any) => ({
      ...prev,
      assigned_to: userId,
      assigned_to_name: matchedUser?.name,
    }));

    const result = await assignLead(String(leadId), userId);
    if (!result.success) {
      setLead((prev: any) => ({
        ...prev,
        assigned_to: previous,
        assigned_to_name: previousName,
      }));
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Lead assigned" });
      load();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const previous = lead.status;
    setLead((prev: any) => ({ ...prev, status: newStatus }));
    const result = await updateLeadStatus(String(leadId), newStatus);
    if (!result.success) {
      setLead((prev: any) => ({ ...prev, status: previous }));
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Status updated" });
      load(); // refresh timeline
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setIsSubmittingNote(true);
    try {
      const result = await addLeadActivity(
        String(leadId),
        activityType,
        note.trim(),
      );
      if (result.success) {
        setNote("");
        toast({ title: "Added to timeline" });
        load();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading || !lead) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{lead.name}</h1>
            <p className="text-sm text-muted-foreground">
              Lead received {formatDate(lead.created_on, "dd-MM-yyyy")} via{" "}
              {lead.source.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        <div className="md:ml-auto flex items-center gap-2">
          <Select
            value={lead.assigned_to ? String(lead.assigned_to) : undefined}
            onValueChange={handleAssign}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lead.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue>
                <Badge className={STATUS_CONFIG[lead.status].className}>
                  {STATUS_CONFIG[lead.status].label}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                <SelectItem key={value} value={value}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — contact + product info */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <Phone className="h-4 w-4 text-muted-foreground" /> {lead.phone}
              </a>
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />{" "}
                  {lead.email}
                </a>
              )}
              {lead.company_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />{" "}
                  {lead.company_name}
                </div>
              )}
            </CardContent>
          </Card>

          {lead.product_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product Interest</CardTitle>
              </CardHeader>
              <CardContent>
                {lead.product_status === 1 ? (
                  <div className="flex gap-3">
                    {lead.product_image && (
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden border shrink-0 bg-muted">
                        <Image
                          src={lead.product_image}
                          alt={lead.live_product_name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {lead.live_product_name}
                      </p>
                      {lead.product_sku && (
                        <p className="text-xs text-muted-foreground">
                          SKU: {lead.product_sku}
                        </p>
                      )}
                      {lead.product_base_price && (
                        <p className="text-sm font-semibold text-primary mt-1">
                          {parseFloat(lead.product_base_price).toLocaleString(
                            "en-IN",
                            {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 0,
                            },
                          )}
                        </p>
                      )}
                      <a
                        href={`/products/${lead.product_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 mt-1.5 hover:underline"
                      >
                        View live product <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                      <p>
                        {lead.product_name || "This product"} is no longer
                        active.
                      </p>
                      <p className="text-xs mt-0.5">
                        Shown as originally requested at the time of inquiry.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {lead.message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{lead.message}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — activity timeline + add note */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
              <CardDescription>
                Log calls, notes, and follow-ups for this lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Log a call, add a note..."
                  className="flex-1 min-h-[40px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />

                <Select
                  value={activityType}
                  onValueChange={(v: any) => setActivityType(v)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddNote}
                  disabled={isSubmittingNote || !note.trim()}
                >
                  Add
                </Button>
              </div>

              <Separator className="mb-4" />

              <div className="flex flex-col gap-4">
                {lead.activities?.length ? (
                  <div className="relative space-y-6">
                    {lead.activities
                      .slice()
                      .reverse()
                      .map((activity: any, index: number) => {
                        const Icon =
                          ACTIVITY_ICON[activity.activity_type] ||
                          MessageSquare;

                        const activityLabel = activity.activity_type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (char: string) =>
                            char.toUpperCase(),
                          );

                        return (
                          <div
                            key={activity.activity_id}
                            className="relative flex gap-4"
                          >
                            {/* Timeline line */}
                            {index !== lead.activities.length - 1 && (
                              <div className="absolute left-4 top-9 bottom-[-24px] w-px bg-border" />
                            )}

                            {/* Icon */}
                            <div className="relative z-10 w-8 h-8 rounded-full border bg-background flex items-center justify-center shrink-0">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1 pb-1">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <h4 className="text-sm font-semibold">
                                    {activityLabel}
                                  </h4>

                                  {activity.activity_type === "status_change" &&
                                    activity.old_status && (
                                      <p className="text-sm text-muted-foreground mt-0.5">
                                        <span className="capitalize">
                                          {activity.old_status}
                                        </span>
                                        <span className="mx-1.5">→</span>
                                        <span className="capitalize font-medium text-foreground">
                                          {activity.new_status}
                                        </span>
                                      </p>
                                    )}
                                </div>

                                <time className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDate(
                                    activity.created_on,
                                    "dd-MM-yyyy HH:mm",
                                  )}
                                </time>
                              </div>

                              {/* Note */}
                              {activity.note && (
                                <div className="mt-2 rounded-md bg-muted/50 px-3 py-2">
                                  <p className="text-sm text-muted-foreground">
                                    {activity.note}
                                  </p>
                                </div>
                              )}

                              {/* User metadata */}
                              {(activity.name ||
                                activity.role_name ||
                                activity.phone_number) && (
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-muted-foreground">
                                  {(activity.name || activity.role_name) && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <User className="h-3.5 w-3.5" />

                                      <span className="text-foreground font-medium">
                                        {activity.name}
                                      </span>

                                      {activity.role_name && (
                                        <>
                                          <span>·</span>
                                          <span>{activity.role_name}</span>
                                        </>
                                      )}
                                    </span>
                                  )}

                                  {activity.phone_number && (
                                    <a
                                      href={`tel:${activity.phone_number}`}
                                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                                    >
                                      <Phone className="h-3.5 w-3.5" />
                                      {activity.phone_number}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />

                    <p className="mt-2 text-sm font-medium">No activity yet</p>

                    <p className="text-xs text-muted-foreground mt-1">
                      Activity related to this lead will appear here.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
