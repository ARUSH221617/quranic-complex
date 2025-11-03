"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function CharityPage() {
  const [image, setImage] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!image) {
      toast({
        title: "Error",
        description: "Please select an image",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("description", description);

    const res = await fetch("/api/payments", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      toast({
        title: "Success",
        description: "Your payment has been submitted",
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
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Charity Donation</CardTitle>
          <CardDescription>
            Please use the bank details below to make a donation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <h3 className="font-bold">Bank Details</h3>
            <p>Bank Name: XYZ Bank</p>
            <p>Account Number: 1234567890</p>
            <p>IBAN: XYZ1234567890</p>
          </div>
          <form className="mt-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="picture">Payment proof</Label>
              <Input
                id="picture"
                type="file"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit}>Submit</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
