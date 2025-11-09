export const dynamic = 'force-dynamic'
import { DataTable } from "@/components/admin/donation/data-table";
import { DonationData } from "@/components/admin/donation/schema";
import { Donation } from "@prisma/client";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define a type for the return value of getDonations to handle success and error states
type GetDonationsResult =
  | { success: true; donations: DonationData[] }
  | { success: false; error: string };

async function getDonations(): Promise<GetDonationsResult> {
  try {
    // Fetch data using a relative path for server-side fetch
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/donation`, {
      cache: "no-store", // Ensure fresh data on each request
    });

    if (!res.ok) {
      // Log the error details for debugging
      console.error(`Failed to fetch donations: ${res.status} ${res.statusText}`);
      let errorMessage = `Failed to fetch donations. Status: ${res.status}`;
      try {
        // Attempt to get a more specific error message from the response body as JSON
        const errorBody = await res.json();
        if (errorBody && errorBody.message) {
          errorMessage = errorBody.message;
        }
      } catch (jsonError) {
        // If JSON parsing fails, try reading as text
        console.error("Error parsing error response body as JSON:", jsonError);
        try {
          const errorText = await res.text(); // Read response as text
          console.error("Error response text:", errorText); // Log the HTML/text response
          // Provide a more informative error message if possible, otherwise stick to status
          errorMessage = `Failed to fetch donations (Status: ${res.status}). The server returned a non-JSON response. Check server logs for details.`;
        } catch (textError) {
          console.error(
            "Error reading error response body as text:",
            textError,
          );
          // Fallback if reading as text also fails
          errorMessage = `Failed to fetch donations (Status: ${res.status}). Unable to parse error response.`;
        }
      }
      return { success: false, error: errorMessage };
    }

    const donations: Donation[] = await res.json();

    return { success: true, donations: donations };
  } catch (error) {
    // Handle network errors or other exceptions during fetch/processing
    console.error("Error fetching donations:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return {
      success: false,
      error: `An unexpected error occurred: ${message}`,
    };
  }
}

export default async function Page() {
  const result = await getDonations();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-bold">Donations</h1>
        <p className="text-sm text-muted-foreground">
          Manage your donations here.
        </p>
      </div>
      {result.success ? (
        <DataTable data={result.donations} />
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
