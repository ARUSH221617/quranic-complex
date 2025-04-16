"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ContactData } from "./schema";

interface ContactViewSheetProps {
  contact: ContactData | null;
  isOpen: boolean;
  onOpenChangeAction: (isOpen: boolean) => void;
}

export function ContactViewSheet({
  contact,
  isOpen,
  onOpenChangeAction,
}: ContactViewSheetProps) {
  if (!contact) {
    return null; // Don't render the sheet if no contact is selected
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChangeAction}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="gap-1 pr-6">
          <SheetTitle>View Contact Message</SheetTitle>
          <SheetDescription>
            Details of the message received from {contact.name}.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="flex flex-1 flex-col space-y-4 overflow-y-auto px-1 py-2">
          <div className="space-y-2">
            <Label htmlFor="view-name">Name</Label>
            <p id="view-name" className="text-sm text-muted-foreground">
              {contact.name}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="view-email">Email</Label>
            <p id="view-email" className="text-sm text-muted-foreground">
              {contact.email}
            </p>
          </div>
          {contact.phone && (
            <div className="space-y-2">
              <Label htmlFor="view-phone">Phone</Label>
              <p id="view-phone" className="text-sm text-muted-foreground">
                {contact.phone}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="view-subject">Subject</Label>
            <p id="view-subject" className="text-sm text-muted-foreground">
              {contact.subject}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="view-message">Message</Label>
            <p
              id="view-message"
              className="whitespace-pre-wrap text-sm text-muted-foreground"
            >
              {contact.message}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="view-date">Received Date</Label>
            <p id="view-date" className="text-sm text-muted-foreground">
              {new Date(contact.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <SheetFooter className="mt-auto pt-6">
          <SheetClose asChild>
            <Button type="button" variant="outline" className="w-full">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
