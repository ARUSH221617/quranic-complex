import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.gallery.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
    });
    const categoryNames = categories.map((item) => item.category);
    return NextResponse.json(categoryNames);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 },
      );
    }
    // Since category is just a string field, we don't need to create a new record here.
    // The client will refetch the distinct categories, and if a new category
    // has been used in a gallery item, it will appear in the list.
    // This POST endpoint is effectively a no-op on the database side,
    // but it's useful for the client to have a consistent API.
    // We'll just return the new category name.
    return NextResponse.json({ name });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { message: "Failed to create category" },
      { status: 500 },
    );
  }
}
