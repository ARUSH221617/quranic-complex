"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const donationSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  frequency: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export function DonationForm() {
  const t = useTranslations("home.donation");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: "500000",
      frequency: "monthly",
      name: "",
      email: "",
    },
  });

  const onSubmit = (data: z.infer<typeof donationSchema>) => {
    console.log("Donation submitted:", data);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-md">
        <h3 className="text-2xl font-bold text-primary">{t("form.thankYou")}</h3>
        <p className="mt-4 text-lg text-gray-700">{t("form.thankYouMessage")}</p>
      </div>
    );
  }

  const suggestedAmounts = [200000, 500000, 1000000];

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t("form.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.amount")}</FormLabel>
                  <div className="flex gap-2">
                    {suggestedAmounts.map((suggestedAmount) => (
                      <Button
                        key={suggestedAmount}
                        type="button"
                        variant={
                          field.value === suggestedAmount.toString()
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          field.onChange(suggestedAmount.toString())
                        }
                      >
                        {suggestedAmount.toLocaleString("fa-IR")} IRR
                      </Button>
                    ))}
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder={t("form.customAmount")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.frequency")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="one-time" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t("form.oneTime")}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="monthly" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t("form.monthly")}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("form.namePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.email")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder={t("form.emailPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {t("form.donateNow")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
