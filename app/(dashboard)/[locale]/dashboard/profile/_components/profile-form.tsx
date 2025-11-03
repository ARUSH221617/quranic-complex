"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@prisma/client";

export default function ProfileForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [bankName, setBankName] = useState(user.bankName || "");
  const [bankCardNumber, setBankCardNumber] = useState(
    user.bankCardNumber || ""
  );
  const { toast } = useToast();

  const handleSubmit = async () => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      body: JSON.stringify({ name, email, bankName, bankCardNumber }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      toast({
        title: "Success",
        description: "Your profile has been updated",
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
    <div>
      <h1 className="text-2xl font-bold">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Update your profile</CardTitle>
          <CardDescription>
            Update your profile information below.
          </-carddescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="bankCardNumber">Bank Card Number</Label>
              <Input
                id="bankCardNumber"
                value={bankCardNumber}
                onChange={(e) => setBankCardNumber(e.target.value)}
              />
            </div>
            <Button className="mt-4" type="submit">
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
