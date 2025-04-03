import Image from "next/image"
import { useTranslations } from "next-intl"

export default function AboutPage() {
  const t = useTranslations("about")
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

      {/* History Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-secondary">{t("historyTitle")}</h2>
              <div className="mt-4 h-1 w-20 bg-accent"></div>
              <div className="mt-6 space-y-4 text-gray-700">
                <p>{t("historyPara1")}</p>
                <p>{t("historyPara2")}</p>
                <p>{t("historyPara3")}</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-80 w-full overflow-hidden rounded-lg">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  alt={t("historyImageAlt")}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary">{t("missionVisionTitle")}</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-lg bg-white p-8 shadow-md">
              <h3 className="text-2xl font-bold text-primary">{t("missionTitle")}</h3>
              <div className="mt-4 h-1 w-16 bg-accent"></div>
              <p className="mt-6 text-gray-700">{t("missionText")}</p>
            </div>
            <div className="rounded-lg bg-white p-8 shadow-md">
              <h3 className="text-2xl font-bold text-primary">{t("visionTitle")}</h3>
              <div className="mt-4 h-1 w-16 bg-accent"></div>
              <p className="mt-6 text-gray-700">{t("visionText")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary">{t("valuesTitle")}</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">{t("valueMasteryTitle")}</h3>
              <p className="mt-4 text-gray-700">{t("valueMasteryText")}</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">{t("valueRespectTitle")}</h3>
              <p className="mt-4 text-gray-700">{t("valueRespectText")}</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">{t("valueExcellenceTitle")}</h3>
              <p className="mt-4 text-gray-700">{t("valueExcellenceText")}</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">{t("valueInnovationTitle")}</h3>
              <p className="mt-4 text-gray-700">{t("valueInnovationText")}</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">{t("valueCooperationTitle")}</h3>
              <p className="mt-4 text-gray-700">{t("valueCooperationText")}</p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">{t("valueResponsibilityTitle")}</h3>
              <p className="mt-4 text-gray-700">{t("valueResponsibilityText")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Staff Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary">{t("staffTitle")}</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
            <p className="mx-auto mt-6 max-w-2xl text-gray-700">{t("staffDescription")}</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Placeholder Staff Members */}
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="text-center">
                <div className="mx-auto h-40 w-40 overflow-hidden rounded-full">
                  <Image
                    src={`/placeholder.svg?height=160&width=160`}
                    alt={t("staffMemberAlt", { index })} // Use placeholder for alt text
                    width={160}
                    height={160}
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Staff name is likely dynamic or placeholder, keeping original structure */}
                <h3 className="mt-4 text-xl font-bold text-secondary">الأستاذ محمد {index}</h3>
                <p className="text-primary">{t("staffMemberRole")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
