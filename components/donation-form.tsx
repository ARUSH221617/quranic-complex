"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      <div className="flex flex-col items-center justify-center rounded-lg bg-white p-6 sm:p-8 text-center shadow-md">
        <h3 className="text-xl sm:text-2xl font-bold text-primary">{t("form.thankYou")}</h3>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-700">{t("form.thankYouMessage")}</p>
      </div>
    );
  }

  const suggestedAmounts = [200000, 500000, 1000000];
  const freqOptions = [
    { value: "one-time", label: t("form.oneTime") },
    { value: "monthly", label: t("form.monthly") },
  ];

  return (
    <Card className="w-full mx-auto rounded-xl sm:max-w-lg">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">{t("form.title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:gap-5">
            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm">{t("form.amount")}</FormLabel>

                  {/* Suggested chips wrap on small screens */}
                  <div className="flex flex-wrap gap-2">
                    {suggestedAmounts.map((suggestedAmount) => {
                      const val = suggestedAmount.toString();
                      const active = field.value === val;
                      return (
                        <Button
                          key={val}
                          type="button"
                          size="sm"
                          variant={active ? "default" : "outline"}
                          className="px-3 py-1.5 text-sm whitespace-nowrap"
                          onClick={() => field.onChange(val)}
                        >
                          {suggestedAmount.toLocaleString("fa-IR")} IRR
                        </Button>
                      );
                    })}
                  </div>

                  {/* Custom amount input */}
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      inputMode="numeric"
                      className="h-10 sm:h-11 text-base"
                      placeholder={t("form.customAmount")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Frequency */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm">{t("form.frequency")}</FormLabel>
                  <FormControl>
                    {/* Stack on mobile, two columns from sm+ */}
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      {freqOptions.map((opt) => {
                        const id = `freq-${opt.value}`;
                        return (
                          <div key={opt.value} className="flex items-center gap-2 rounded-md border p-3">
                            <RadioGroupItem id={id} value={opt.value} />
                            <label htmlFor={id} className="text-sm">
                              {opt.label}
                            </label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm">{t("form.name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-10 sm:h-11 text-base"
                      placeholder={t("form.namePlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm">{t("form.email")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      className="h-10 sm:h-11 text-base"
                      placeholder={t("form.emailPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-11 text-base">
              {t("form.donateNow")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
                          }
