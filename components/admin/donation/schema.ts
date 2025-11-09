import { z } from "zod";

export const donationSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  amount: z.number(),
  receipt: z.string().optional(),
  createdAt: z.string(),
});

export type DonationData = z.infer<typeof donationSchema>;
