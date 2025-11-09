"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const donationId = searchParams.get("id");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a payment receipt to upload.",
      });
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("donationId", donationId as string);

    try {
      const response = await fetch("/api/donation/upload-receipt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload receipt.");
      }

      const { donation } = await response.json();

      // Send the thanks email
      await fetch("/api/send-thanks-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: donation.email,
          subject: "Thank You for Your Donation",
          name: donation.name,
        }),
      });

      toast({
        title: "Receipt uploaded successfully!",
        description: "Thank you for your donation. A confirmation email has been sent.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Complete Your Donation</h1>
        <p className="text-lg mb-8">
          Please transfer the donation amount to the following bank account and
          upload a receipt of your payment.
        </p>
        <div className="mb-8 p-4 border rounded-lg">
          <p className="text-xl font-semibold">Charity Bank Account</p>
          <p className="text-lg">Card Number: 1234-5678-9012-3456</p>
        </div>
        <div className="w-full max-w-md">
          <Input type="file" onChange={handleFileChange} className="mb-4" />
          <Button onClick={handleSubmit} disabled={isLoading || !selectedFile}>
            {isLoading ? "Uploading..." : "Upload Receipt"}
          </Button>
        </div>
      </main>
    </div>
  );
}
