import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

interface GalleryImage {
  id: string;
  title: string;
  titleEn: string;
  titleAr: string;
  titleFa: string;
  image: string;
  category: string;
}

export default async function GalleryPage() {
  const t = await getTranslations("gallery");
  const locale = await getLocale();

  // Fetch gallery images from API
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gallery`);
  const galleryImages = (await res.json()) as GalleryImage[];
  const categories = [
    "categoryAll",
    "categoryEvents",
    "categoryCompetitions",
    "categoryLessons",
    "categoryVisits",
    "categoryFacilities",
  ] as const; // Define categories using keys

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

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-lg"
              >
                <div className="relative h-64 w-full">
                  <Image
                    src={image.image || "/placeholder.svg"}
                    alt={locale === 'ar' ? image.titleAr : 
                         locale === 'fa' ? image.titleFa : 
                         image.titleEn}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <h3 className="text-lg font-bold text-white">
                    {locale === 'ar' ? image.titleAr : 
                     locale === 'fa' ? image.titleFa : 
                     image.titleEn}
                  </h3>
                  <p className="text-sm text-gray-200">{image.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary-text">
              {t("categoriesTitle")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {categories.map((categoryKey) => (
              <button
                key={categoryKey}
                className="rounded-full bg-white px-6 py-2 text-gray-700 shadow-md transition-colors hover:bg-primary hover:text-white"
              >
                {t(categoryKey)}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
