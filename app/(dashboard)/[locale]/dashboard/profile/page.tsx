import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./_components/profile-form";
import { authOptions } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
  });

  if (!user) {
    return <div>User not found</div>;
  }

  return <ProfileForm user={user} />;
}
