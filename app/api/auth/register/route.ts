import { NextResponse } from "next/server";
import { PrismaClient, QuranicStudyLevel } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import path from "path";
import fs from "fs";
import crypto from "crypto"; // Import crypto for token generation
import { sendVerificationEmail } from "@/lib/email"; // Import email sending function

const prisma = new PrismaClient();

// Define the validation schema using Zod
const registerSchema = z.object({
  name: z.string().min(1, { message: "Full name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  phone: z.string().optional(), // Assuming phone is optional for now
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }), // Validate as string, convert later
  nationalCode: z
    .string()
    .length(10, { message: "National code must be 10 digits" })
    .regex(/^\d+$/, { message: "National code must be numeric" }),
  quranicStudyLevel: z.nativeEnum(QuranicStudyLevel),
  nationalCardPicture: z
    .instanceof(File, { message: "National card picture is required" })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File must be less than 5MB",
    })
    .refine((file) => ["image/jpeg", "image/png"].includes(file.type), {
      message: "Only JPEG and PNG images are allowed",
    }),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries());
    const validation = registerSchema.safeParse({
      ...body,
      nationalCardPicture: formData.get("nationalCardPicture"),
    });

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      phone,
      dateOfBirth,
      nationalCode,
      quranicStudyLevel,
    } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Check if national code already exists
    const existingNationalCode = await prisma.user.findUnique({
      where: { nationalCode },
    });

    if (existingNationalCode) {
      return NextResponse.json(
        { message: "User with this national code already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Process file upload
    const file = formData.get("nationalCardPicture") as File;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `national-card-${uniqueSuffix}${path.extname(file.name)}`;
    const filePath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.promises.writeFile(filePath, buffer);

    const nationalCardPicturePath = `/uploads/${filename}`;

    // Create the user in the database
    // Note: Password is not stored directly on the User model with Prisma adapter + NextAuth credentials provider.
    // Hashing is done, but the actual storage/verification happens within NextAuth's flow.
    // We still need the hashed password for potential custom logic or if not using NextAuth credentials directly.
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // Store the hashed password
        phone, // Store phone if provided
        dateOfBirth: new Date(dateOfBirth), // Convert string to Date object
        nationalCode,
        quranicStudyLevel,
        nationalCardPicture: nationalCardPicturePath, // Store placeholder path
        role: "STUDENT", // Assign default role
      },
    });

    // --- Start Email Verification ---
    // 1. Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

    // 2. Store token in the database
    await prisma.verificationToken.create({
      data: {
        identifier: newUser.email, // Use email as identifier
        token: verificationToken,
        expires,
      },
    });

    // 3. Construct verification link
    const verificationLink = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`;

    // 4. Send verification email
    try {
      await sendVerificationEmail(newUser.email, verificationLink);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Decide how to handle this: maybe log it but still inform user?
      // For now, we'll proceed but log the error.
      // In production, you might want a more robust error handling/retry mechanism.
    }
    // --- End Email Verification ---

    // Return success message instead of user object
    return NextResponse.json(
      {
        message:
          "Registration successful! Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration Error:", error);
    // Add specific error handling if needed (e.g., Prisma errors)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
