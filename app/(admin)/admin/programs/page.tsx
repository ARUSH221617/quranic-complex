import { DataTable } from "@/components/admin/programs/data-table";
import { ProgramData } from "@/components/admin/programs/schema";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define a type for the return value of getPrograms to handle success and error states
type GetProgramsResult =
  | { success: true; programs: ProgramData[] }
  | { success: false; error: string };

async function getPrograms(): Promise<GetProgramsResult> {
  try {
    // Fetch data using a relative path for server-side fetch
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/programs`, {
      cache: "no-store", // Ensure fresh data on each request
    });

    if (!res.ok) {
      // Log the error details for debugging
      console.error(`Failed to fetch programs: ${res.status} ${res.statusText}`);
      let errorMessage = `Failed to fetch programs. Status: ${res.status}`;
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
          errorMessage = `Failed to fetch programs (Status: ${res.status}). The server returned a non-JSON response. Check server logs for details.`;
        } catch (textError) {
          console.error(
            "Error reading error response body as text:",
            textError,
          );
          // Fallback if reading as text also fails
          errorMessage = `Failed to fetch programs (Status: ${res.status}). Unable to parse error response.`;
        }
      }
      return { success: false, error: errorMessage };
    }

    const programs = await res.json();

    return { success: true, programs };
  } catch (error) {
    // Handle network errors or other exceptions during fetch/processing
    console.error("Error fetching programs:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return {
      success: false,
      error: `An unexpected error occurred: ${message}`,
    };
  }
}

export default async function Page() {
  const result = await getPrograms();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-bold">Programs</h1>
        <p className="text-sm text-muted-foreground">
          Manage programs here. You can add, edit, or delete programs as needed.
        </p>
      </div>
      {result.success ? (
        <DataTable data={result.programs} />
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