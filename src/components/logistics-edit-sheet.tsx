import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { API_BASE_URL, useAuth } from "@/lib/auth";

export type ShipmentStatusUi = "planned" | "in_transit" | "delayed" | "delivered";

const schema = z.object({
  reference: z.string().trim().min(2).max(120),
  origin: z.string().trim().min(2).max(120),
  destination: z.string().trim().min(2).max(120),
  carrier: z.string().trim().min(1).max(120).optional().or(z.literal("")),
  status: z.enum(["planned", "in_transit", "delayed", "delivered"]),
  expectedDeliveryDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v).toISOString() : undefined)),
});

type FormValues = z.infer<typeof schema>;

type ShipmentLike = {
  id: string;
  mongoId?: string;
  reference: string;
  origin: string;
  destination: string;
  carrier?: string;
  status: ShipmentStatusUi;
  expectedDeliveryDate?: string;
};

export function LogisticsEditSheet({
  trigger,
  shipment,
  onUpdated,
}: {
  trigger: ReactNode;
  shipment: ShipmentLike | null;
  onUpdated?: (next: ShipmentLike) => void;
}) {
  const { token } = useAuth();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultValues = useMemo(() => {
    if (!shipment) {
      return {
        reference: "",
        origin: "",
        destination: "",
        carrier: "",
        status: "planned" as ShipmentStatusUi,
        expectedDeliveryDate: "",
      } satisfies FormValues;
    }

    return {
      reference: shipment.reference,
      origin: shipment.origin,
      destination: shipment.destination,
      carrier: shipment.carrier ?? "",
      status: shipment.status,
      expectedDeliveryDate: shipment.expectedDeliveryDate
        ? new Date(shipment.expectedDeliveryDate).toISOString().slice(0, 10)
        : "",
    } satisfies FormValues;
  }, [shipment]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    if (!shipment) return;
    form.reset(defaultValues);
  }, [open, shipment?.id, defaultValues, form]);

  const reset = () => {
    setSaving(false);
    form.reset(defaultValues);
  };

  const onSubmit = async (values: FormValues) => {
    if (!token || !shipment) {
      toast.error("You must be signed in to edit a shipment.");
      return;
    }

    const id = shipment.mongoId ?? shipment.id;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/logistics/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          reference: values.reference,
          origin: values.origin,
          destination: values.destination,
          carrier: values.carrier ? values.carrier : undefined,
          status: values.status,
          expectedDeliveryDate: values.expectedDeliveryDate,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to update shipment");
      }

      const next = payload?.shipment;
      onUpdated?.({
        id: next?._id ?? id,
        mongoId: next?._id ?? id,
        reference: next?.reference,
        origin: next?.origin,
        destination: next?.destination,
        carrier: next?.carrier,
        status: next?.status,
        expectedDeliveryDate: next?.expectedDeliveryDate,
      });

      toast.success("Shipment updated", { description: next?.reference });
      setOpen(false);
      reset();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to update shipment";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="border-b p-6">
          <SheetTitle>Edit shipment</SheetTitle>
          <SheetDescription>
            Update shipment reference, route, carrier, and delivery status.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. SHIP-1024" maxLength={120} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Chicago DC" maxLength={120} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Atlanta Hub" maxLength={120} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carrier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Nexus Freight" maxLength={120} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["planned", "in_transit", "delayed", "delivered"].map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected delivery (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t bg-muted/30 p-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !shipment}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
