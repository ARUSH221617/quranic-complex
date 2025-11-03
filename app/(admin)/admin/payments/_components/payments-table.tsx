"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Payment, User, UserStatus } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

type PaymentWithUser = Payment & { user: User };

export default function PaymentsTable({
  payments: initialPayments,
}: {
  payments: PaymentWithUser[];
}) {
  const [payments, setPayments] = useState(initialPayments);
  const { toast } = useToast();

  const handleStatusChange = async (paymentId: string, status: UserStatus) => {
    const res = await fetch(`/api/payments/${paymentId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      setPayments((prevPayments) =>
        prevPayments.map((p) => (p.id === paymentId ? { ...p, status } : p))
      );
      toast({
        title: "Success",
        description: "Payment status has been updated",
      });
    } else {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Image</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{payment.user.name}</TableCell>
            <TableCell>
              <a href={payment.image} target="_blank" rel="noreferrer">
                View Image
              </a>
            </TableCell>
            <TableCell>{payment.description}</TableCell>
            <TableCell>
              <Badge>{payment.status}</Badge>
            </TableCell>
            <TableCell>
              <Button
                onClick={() => handleStatusChange(payment.id, "APPROVED")}
              >
                Approve
              </Button>
              <Button
                onClick={() => handleStatusChange(payment.id, "REJECTED")}
              >
                Reject
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
