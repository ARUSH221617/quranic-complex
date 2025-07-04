import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { categoryName: string } },
) {
  const categoryName = decodeURIComponent(params.categoryName);
  const { replacementCategory } = await req.json();

  try {
    // Update all gallery items with the specified category
    await prisma.gallery.updateMany({
      where: {
        category: categoryName,
      },
      data: {
        category: replacementCategory || "", // Use replacement or set to empty string
      },
    });

    return NextResponse.json(
      { message: `Category '${categoryName}' updated successfully.` },
      { status: 200 },
    );
  } catch (error) {
    console.error(`Failed to update category '${categoryName}':`, error);
    return NextResponse.json(
      { message: `Failed to update category '${categoryName}'` },
      { status: 500 },
    );
  }
}
