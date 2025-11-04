import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  image: string;
  category: string;
}

async function fetchWithLocale<T>(
  endpoint: string,
  locale: string,
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = new URL(`${baseUrl}/api/${endpoint}`);
  url.searchParams.append("locale", locale);

  const response = await fetch(url.toString(), { next: { revalidate: 3600 } }); // Cache for 1 hour

  if (!response.ok) {
    throw new Error(`Failed to fetch from ${endpoint}: ${response.statusText}`);
  }

  return response.json();
}

export default async function GalleryPage() {
  const t = await getTranslations("gallery");
  const locale = await getLocale();

  // Fetch gallery images from API
  const galleryImages = await fetchWithLocale<GalleryImage[]>(
    "gallery",
    locale,
  ).catch(() => []);

  // Fetch categories from API
  const fetchedCategories = await fetchWithLocale<string[]>(
    "gallery/categories",
    locale,
  ).catch(() => []);

  // Add "All" category to the list
  const categories = ["All", ...fetchedCategories];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-primary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">{t("title")}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg">{t("subtitle")}</p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className="rounded-full border-2 border-primary bg-transparent px-6 py-2 font-semibold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-accent dark:border-accent dark:text-accent dark:hover:bg-accent dark:hover:text-white"
              >
                {category === "All" ? t("categoryAll") : category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative h-64 w-full overflow-hidden rounded-lg shadow-lg"
                >
                  <Image
                    src={image.image || "/placeholder.jpg"}
                    alt={image.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <h3 className="text-lg font-bold text-white">
                      {image.title}
                    </h3>
                    <p className="text-sm text-gray-200">
                      {image.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-4 text-center text-gray-500 dark:text-gray-400">
              {t("noGallery")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
