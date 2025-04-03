import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { programs, news } from "@/lib/placeholder-data"

export default function Home() {
  // Get featured programs (first 3)
  const featuredPrograms = programs.slice(0, 3)
  // Get latest news (first 3)
  const latestNews = news.slice(0, 3)

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-secondary py-20 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">مجمع قرآنی خرمشهر</h1>
              <p className="mt-4 text-xl">مركز متخصص في تعليم القرآن الكريم وعلومه بأساليب تربوية حديثة</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/programs">
                  <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
                    تصفح البرامج
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white bg-transparent text-white hover:bg-white/10"
                  >
                    اتصل بنا
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-80">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  alt="مجمع قرآنی خرمشهر"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Snippet */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">من نحن</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-8 text-center">
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-700">
              مجمع قرآنی خرمشهر هو مركز تعليمي متخصص في تعليم القرآن الكريم وعلومه، تأسس عام 2010 بهدف نشر الثقافة
              القرآنية وتعزيز حفظ القرآن الكريم وتجويده. يضم المجمع نخبة من المعلمين المتخصصين في علوم القرآن الكريم.
            </p>
            <div className="mt-8">
              <Link href="/about">
                <Button
                  variant="outline"
                  className="border-secondary text-secondary-text hover:bg-secondary hover:text-white"
                >
                  المزيد عنا
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">برامجنا المميزة</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPrograms.map((program) => (
              <Card key={program.id} className="overflow-hidden transition-all duration-300 hover:shadow-xl">
                <div className="relative h-48 w-full">
                  <Image src={program.image || "/placeholder.svg"} alt={program.title} fill className="object-cover" />
                </div>
                <CardHeader>
                  <CardTitle>{program.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{program.description}</p>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold">الفئة العمرية:</span> {program.ageGroup}
                    </p>
                    <p>
                      <span className="font-semibold">المواعيد:</span> {program.schedule}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/programs" className="text-primary hover:underline">
                    عرض التفاصيل
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/programs">
              <Button className="bg-primary text-white hover:bg-primary/90">عرض جميع البرامج</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">آخر الأخبار والفعاليات</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {latestNews.map((item) => (
              <Card key={item.id} className="overflow-hidden transition-all duration-300 hover:shadow-xl">
                <div className="relative h-48 w-full">
                  <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                </div>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(item.date).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{item.excerpt}</p>
                </CardContent>
                <CardFooter>
                  <Link href="/news" className="text-primary hover:underline">
                    قراءة المزيد
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/news">
              <Button className="bg-primary text-white hover:bg-primary/90">عرض جميع الأخبار</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-accent py-16 text-accent-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">انضم إلينا اليوم</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg">
              سجل الآن في أحد برامجنا المتميزة لتعلم القرآن الكريم وعلومه على يد نخبة من المعلمين المتخصصين.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/programs">
                <Button size="lg" className="bg-secondary text-white hover:bg-secondary/90">
                  تصفح البرامج
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-secondary bg-transparent text-secondary-text hover:bg-secondary hover:text-white"
                >
                  تواصل معنا
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

