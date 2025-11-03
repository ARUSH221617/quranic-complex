"use client";

import type React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const t = useTranslations("contact");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("formSubmitError"));
      }

      setSubmitStatus({
        success: true,
        message: t("formSubmitSuccess"),
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: error instanceof Error ? error.message : t("formSubmitError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-secondary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">{t("title")}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg">{t("subtitle")}</p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-secondary-text">
                {t("formTitle")}
              </h2>
              <div className="mt-4 h-1 w-20 bg-accent"></div>
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t("formNameLabel")}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t("formEmailLabel")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("formPhoneLabel")}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("formSubjectLabel")}
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                  >
                    <option value="">{t("formSubjectPlaceholder")}</option>
                    <option value={t("formSubjectOptionGeneral")}>
                      {t("formSubjectOptionGeneral")}
                    </option>
                    <option value={t("formSubjectOptionDonation")}>
                      {t("formSubjectOptionDonation")}
                    </option>
                    <option value={t("formSubjectOptionVolunteer")}>
                      {t("formSubjectOptionVolunteer")}
                    </option>
                    <option value={t("formSubjectOptionSuggestions")}>
                      {t("formSubjectOptionSuggestions")}
                    </option>
                    <option value={t("formSubjectOptionOther")}>{t("formSubjectOptionOther")}</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("formMessageLabel")}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                  ></textarea>
                </div>
                <div>
                  <Button
                    type="submit"
                    className="w-full bg-primary text-white hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("formSubmitting") : t("formSubmitButton")}
                  </Button>
                  {submitStatus && (
                    <p
                      className={`mt-2 text-center text-sm ${
                        submitStatus.success ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {submitStatus.message}
                    </p>
                  )}
                </div>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-secondary-text">
                {t("infoTitle")}
              </h2>
              <div className="mt-4 h-1 w-20 bg-accent"></div>
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("infoAddressTitle")}
                  </h3>
                  <p className="mt-2 text-gray-700">{t("infoAddressValue")}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("infoHoursTitle")}
                  </h3>
                  <p className="mt-2 text-gray-700">
                    {t("infoHoursSatThu")}
                    <br />
                    {t("infoHoursFri")}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("infoPhoneTitle")}
                  </h3>
                  <p className="mt-2 text-gray-700">123-456-7890</p>{" "}
                  {/* Assuming phone number is not translated */}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("infoEmailTitle")}
                  </h3>
                  <p className="mt-2 text-gray-700">
                    info@quran-khorramshahr.com
                  </p>{" "}
                  {/* Assuming email is not translated */}
                </div>
              </div>

              {/* Map */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("mapTitle")}
                </h3>
                <div className="mt-4 h-80 w-full overflow-hidden rounded-lg bg-gray-200">
                  {/* Placeholder for map */}
                  <div className="flex h-full w-full items-center justify-center">
                    <p className="text-gray-500">{t("mapPlaceholder")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
