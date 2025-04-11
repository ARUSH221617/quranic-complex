import { DataTable } from "@/components/admin/user/data-table";
import { UserData } from "@/components/admin/user/schema";
import { User } from "@prisma/client";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define a type for the return value of getUsers to handle success and error states
type GetUsersResult =
  | { success: true; users: UserData[] }
  | { success: false; error: string };

async function getUsers(): Promise<GetUsersResult> {
  try {
    // Fetch data from the API route
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
      cache: "no-store", // Ensure fresh data on each request
    });

    if (!res.ok) {
      // Log the error details for debugging
      console.error(`Failed to fetch users: ${res.status} ${res.statusText}`);
      let errorMessage = `Failed to fetch users. Status: ${res.status}`;
      try {
        // Attempt to get a more specific error message from the response body
        const errorBody = await res.json();
        if (errorBody && errorBody.message) {
          errorMessage = errorBody.message;
        }
      } catch (jsonError) {
        // Ignore if response body is not JSON or empty
        console.error("Error parsing error response body:", jsonError);
      }
      return { success: false, error: errorMessage };
    }

    const users: User[] = await res.json();

    // Transform User[] to UserData[]
    const userData = users.map((user) => ({
      ...user,
      verificationToken: null, // Explicitly setting fields not in UserData to null or default
      verificationTokenExpires: null,
    }));

    return { success: true, users: userData };
  } catch (error) {
    // Handle network errors or other exceptions during fetch/processing
    console.error("Error fetching users:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return {
      success: false,
      error: `An unexpected error occurred: ${message}`,
    };
  }
}

export default async function Page() {
  const result = await getUsers();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage your users here. You can add, edit, or delete users as needed.
        </p>
      </div>
      {result.success ? (
        <DataTable data={result.users} />
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
