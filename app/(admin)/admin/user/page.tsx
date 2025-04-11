import { DataTable } from "@/components/admin/user/data-table";
import { UserData } from "@/components/admin/user/schema";
import { User } from "@prisma/client";

async function getUsers(): Promise<UserData[]> {
  // Fetch data from the API route
  // Note: Using the full URL is recommended for server-side fetch in Next.js App Router
  // Replace 'http://localhost:3000' with your actual base URL or use an environment variable
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
    cache: "no-store", // Ensure fresh data on each request
  });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch users");
  }

  const users: User[] = await res.json();

  // Transform User[] to UserData[]
  return users.map((user) => ({
    ...user,
    verificationToken: null,
    verificationTokenExpires: null,
  }));
}

export default async function Page() {
  const users = await getUsers();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        {/* <p className="text-sm text-muted-foreground">
          Manage your users here. You can add, edit, or delete users as needed.
        </p> */}
      </div>
      <DataTable data={users} />
    </div>
  );
}
