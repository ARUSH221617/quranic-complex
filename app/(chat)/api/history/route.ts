import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { getChatsByUserId } from "@/lib/db/queries";
import { getServerSession } from "next-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = parseInt(searchParams.get("limit") || "10");
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return Response.json(
      "Only one of starting_after or ending_before can be provided!",
      { status: 400 },
    );
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  try {
    const chats = await getChatsByUserId({
      userId: session.user.id,
      limit,
      cursor: startingAfter || endingBefore,
      direction: startingAfter
        ? "forward"
        : endingBefore
          ? "backward"
          : undefined,
    });

    return Response.json(chats);
  } catch (_) {
    return Response.json("Failed to fetch chats!", { status: 500 });
  }
}
