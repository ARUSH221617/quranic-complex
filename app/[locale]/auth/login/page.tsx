"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"

export default function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      })

      if (result?.error) {
        setError(locale === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password")
      } else {
        router.push(`/${locale}/dashboard`)
      }
    } catch (error) {
      setError(locale === "ar" ? "حدث خطأ أثناء تسجيل الدخول" : "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{locale === "ar" ? "تسجيل الدخول" : "Login"}</CardTitle>
          <CardDescription>
            {locale === "ar" ? "قم بتسجيل الدخول للوصول إلى بوابة الطالب" : "Sign in to access the student portal"}
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
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
              />
            </div>

            <div>
              <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90" disabled={isLoading}>
                {isLoading
                  ? locale === "ar"
                    ? "جاري تسجيل الدخول..."
                    : "Signing in..."
                  : locale === "ar"
                    ? "تسجيل الدخول"
                    : "Sign in"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            {locale === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
            <Link href={`/${locale}/auth/register`} className="font-medium text-primary hover:underline">
              {locale === "ar" ? "التسجيل" : "Register"}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

