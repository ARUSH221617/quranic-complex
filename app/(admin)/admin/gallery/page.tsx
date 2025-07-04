import { GalleryDataTable } from "@/components/admin/gallery/data-table";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GalleryData } from "@/components/admin/gallery/schema";

type GetGalleryResult =
  | { success: true; gallery: GalleryData[] }
  | { success: false; error: string };

async function getGallery(): Promise<GetGalleryResult> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/gallery?locale=en`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) {
      console.error(`Failed to fetch gallery: ${res.status} ${res.statusText}`);
      let errorMessage = `Failed to fetch gallery. Status: ${res.status}`;
      try {
        const errorBody = await res.json();
        if (errorBody && errorBody.message) {
          errorMessage = errorBody.message;
        }
      } catch (jsonError) {
        console.error("Error parsing error response body as JSON:", jsonError);
        try {
          const errorText = await res.text();
          console.error("Error response text:", errorText);
          errorMessage = `Failed to fetch gallery (Status: ${res.status}). The server returned a non-JSON response. Check server logs for details.`;
        } catch (textError) {
          console.error(
            "Error reading error response body as text:",
            textError,
          );
          errorMessage = `Failed to fetch gallery (Status: ${res.status}). Unable to parse error response.`;
        }
      }
      throw new Error(errorMessage);
    }

    const gallery = await res.json();
    return { success: true, gallery };
  } catch (error) {
    console.error("Error fetching gallery:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return {
      success: false,
      error: `An unexpected error occurred: ${message}`,
    };
  }
}

export default async function Page() {
  const result = await getGallery();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-bold">Gallery</h1>
        <p className="text-sm text-muted-foreground">
          Manage gallery items here. You can add, edit, or delete gallery items
          as needed.
        </p>
      </div>
      {result.success ? (
        <GalleryDataTable data={result.gallery} />
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
