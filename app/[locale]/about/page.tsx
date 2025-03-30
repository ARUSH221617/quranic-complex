import Image from "next/image"

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-secondary py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">من نحن</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg">تعرف على مجمع قرآنی خرمشهر، رسالتنا، رؤيتنا، وقيمنا</p>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-secondary">تاريخ المجمع</h2>
              <div className="mt-4 h-1 w-20 bg-accent"></div>
              <div className="mt-6 space-y-4 text-gray-700">
                <p>
                  تأسس مجمع قرآنی خرمشهر في عام 2010 بمبادرة من مجموعة من علماء الدين والمهتمين بنشر علوم القرآن الكريم
                  في المنطقة.
                </p>
                <p>
                  بدأ المجمع بفصلين دراسيين فقط وعدد محدود من الطلاب، وتوسع تدريجياً ليصبح صرحاً تعليمياً متكاملاً يضم
                  العديد من القاعات الدراسية والمرافق التعليمية الحديثة.
                </p>
                <p>
                  على مدار السنوات، تخرج من المجمع المئات من حفظة كتاب الله، وأصبح المجمع مركزاً رائداً في تعليم القرآن
                  الكريم وعلومه في المنطقة.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-80 w-full overflow-hidden rounded-lg">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  alt="تاريخ مجمع قرآنی خرمشهر"
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
            <h2 className="text-3xl font-bold text-secondary">رسالتنا ورؤيتنا</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-lg bg-white p-8 shadow-md">
              <h3 className="text-2xl font-bold text-primary">رسالتنا</h3>
              <div className="mt-4 h-1 w-16 bg-accent"></div>
              <p className="mt-6 text-gray-700">
                نسعى في مجمع قرآنی خرمشهر إلى نشر تعاليم القرآن الكريم وعلومه بين أفراد المجتمع، وتخريج جيل متميز من
                حفظة كتاب الله المتقنين لتلاوته والعاملين بأحكامه، من خلال تقديم برامج تعليمية متميزة على يد نخبة من
                المعلمين المتخصصين.
              </p>
            </div>
            <div className="rounded-lg bg-white p-8 shadow-md">
              <h3 className="text-2xl font-bold text-primary">رؤيتنا</h3>
              <div className="mt-4 h-1 w-16 bg-accent"></div>
              <p className="mt-6 text-gray-700">
                نتطلع إلى أن يكون مجمع قرآنی خرمشهر صرحاً تعليمياً رائداً على المستوى الإقليمي في مجال تعليم القرآن الكريم
                وعلومه، وأن يكون مرجعاً موثوقاً في نشر الثقافة القرآنية والقيم الإسلامية في المجتمع.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary">قيمنا</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">الإتقان</h3>
              <p className="mt-4 text-gray-700">
                نسعى دائماً إلى تقديم أعلى مستويات الجودة في التعليم والتدريب، ونحرص على إتقان العمل في جميع جوانبه.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">الاحترام</h3>
              <p className="mt-4 text-gray-700">
                نؤمن بأهمية احترام جميع الأفراد بغض النظر عن خلفياتهم وقدراتهم، ونعمل على توفير بيئة تعليمية قائمة على
                الاحترام المتبادل.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">التميز</h3>
              <p className="mt-4 text-gray-700">
                نسعى دائماً إلى التميز في جميع أعمالنا، ونشجع طلابنا على السعي للتميز في دراستهم وحياتهم.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">الابتكار</h3>
              <p className="mt-4 text-gray-700">
                نؤمن بأهمية الابتكار والتجديد في أساليب التعليم، ونسعى دائماً إلى تطوير برامجنا وطرق تدريسنا.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">التعاون</h3>
              <p className="mt-4 text-gray-700">
                نؤمن بأهمية العمل الجماعي والتعاون بين جميع أفراد المجمع من إدارة ومعلمين وطلاب وأولياء أمور.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="text-xl font-bold text-primary">المسؤولية</h3>
              <p className="mt-4 text-gray-700">
                نتحمل مسؤولية أعمالنا ونسعى دائماً إلى تحقيق أهدافنا بكل أمانة وإخلاص.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Staff Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-secondary">فريق العمل</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
            <p className="mx-auto mt-6 max-w-2xl text-gray-700">
              يضم مجمع قرآنی خرمشهر نخبة من المعلمين المتخصصين في علوم القرآن الكريم والتجويد والتفسير، بالإضافة إلى
              فريق إداري متميز.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Placeholder Staff Members */}
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="text-center">
                <div className="mx-auto h-40 w-40 overflow-hidden rounded-full">
                  <Image
                    src={`/placeholder.svg?height=160&width=160`}
                    alt={`عضو فريق العمل ${index}`}
                    width={160}
                    height={160}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-4 text-xl font-bold text-secondary">الأستاذ محمد {index}</h3>
                <p className="text-primary">معلم القرآن الكريم والتجويد</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

