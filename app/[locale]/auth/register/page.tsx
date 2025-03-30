"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"

export default function RegisterPage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(locale === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match")
      setIsLoading(false)
      return
    }

    // In a real app, you would send this data to your API
    // For now, we'll just simulate a successful registration
    setTimeout(() => {
      setIsLoading(false)
      // Redirect to login page
      router.push(`/${locale}/auth/login?registered=true`)
    }, 1500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {locale === "ar" ? "إنشاء حساب جديد" : "Create an Account"}
          </CardTitle>
          <CardDescription>
            {locale === "ar" ? "قم بإنشاء حساب للوصول إلى بوابة الطالب" : "Register to access the student portal"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {locale === "ar" ? "الاسم الكامل" : "Full Name"}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {locale === "ar" ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {locale === "ar" ? "كلمة المرور" : "Password"}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
              />
            </div>

            <div>
              <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90" disabled={isLoading}>
                {isLoading
                  ? locale === "ar"
                    ? "جاري التسجيل..."
                    : "Registering..."
                  : locale === "ar"
                    ? "التسجيل"
                    : "Register"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            {locale === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
            <Link href={`/${locale}/auth/login`} className="font-medium text-primary hover:underline">
              {locale === "ar" ? "تسجيل الدخول" : "Sign in"}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

