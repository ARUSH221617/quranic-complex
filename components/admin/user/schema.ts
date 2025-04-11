import { z } from "zod";
import { QuranicStudyLevel, UserRole, UserStatus } from "@prisma/client";

// Define the schema based on the Prisma User model
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.date().nullable(),
  image: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.nativeEnum(UserRole),
  nationalCode: z.string(),
  dateOfBirth: z.date(),
  quranicStudyLevel: z.nativeEnum(QuranicStudyLevel).or(z.null()).default(null),
  nationalCardPicture: z.string().nullable(),
  status: z.nativeEnum(UserStatus),
  password: z.string().nullable(),
  loginCode: z.string().nullable(),
  loginCodeExpires: z.date().nullable(),
});

// Type for the user data based on the schema
export type UserData = Omit<z.infer<typeof userSchema>, "quranicStudyLevel"> & {
  quranicStudyLevel: QuranicStudyLevel | null;
};
