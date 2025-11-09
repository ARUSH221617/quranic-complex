import {
  PrismaClient,
  UserRole,
  QuranicStudyLevel,
  UserStatus,
} from "@prisma/client"; // Added UserStatus
import { hash } from "bcryptjs"; // Use bcryptjs as installed in package.json

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Seed Users (Remains the same) ---
  // Note: User model doesn't have translated fields in this schema version
  const password = await hash("amir1386", 10); // Hash a default password
  const user1 = await prisma.user.upsert({
    where: { email: "arush221617@gmail.com" },
    update: {},
    create: {
      email: "arush221617@gmail.com",
      name: "Admin User",
      role: UserRole.ADMIN,
      password: password,
      status: UserStatus.APPROVED,
      nationalCode: "0000000001", // Ensure uniqueness
      dateOfBirth: new Date("1990-01-01T00:00:00Z"),
      quranicStudyLevel: QuranicStudyLevel.ADVANCED,
      nationalCardPicture: "/placeholder-user.jpg", // Placeholder path
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: {
      email: "student@example.com",
      name: "Student User",
      role: UserRole.STUDENT,
      password: password,
      nationalCode: "0000000002", // Ensure uniqueness
      dateOfBirth: new Date("1995-05-15T00:00:00Z"),
      quranicStudyLevel: QuranicStudyLevel.INTERMEDIATE,
      nationalCardPicture: "/placeholder-user.jpg", // Placeholder path
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Regular User",
      password: password,
      role: UserRole.USER,
      nationalCode: "0000000003", // Ensure uniqueness
      dateOfBirth: new Date("2000-10-20T00:00:00Z"),
      quranicStudyLevel: QuranicStudyLevel.BEGINNER,
      nationalCardPicture: "/placeholder-user.jpg", // Placeholder path
    },
  });

  console.log(`Created users: ${user1.name}, ${user2.name}, ${user3.name}`);

  // --- Seed News with Translations ---
  const newsItem1 = await prisma.news.upsert({
    where: { slug: "first-news" },
    update: {},
    create: {
      slug: "first-news",
      date: new Date(),
      image: "/placeholder.jpg",
    },
  });

  await prisma.newsTranslation.createMany({
    data: [
      {
        newsId: newsItem1.id,
        locale: "en",
        title: "First News Article",
        content: "This is the content of the first news article.",
        excerpt: "A short summary of the first news article.",
        metaTitle: "First News Meta Title",
        metaDescription: "Meta description for the first news.",
        keywords: "news, first, article",
      },
      {
        newsId: newsItem1.id,
        locale: "fa",
        title: "اولین خبر",
        content: "این محتوای اولین خبر است.",
        excerpt: "خلاصه ای کوتاه از اولین خبر.",
        metaTitle: "متا تایتل اولین خبر",
        metaDescription: "متا دیسکریپشن برای اولین خبر.",
        keywords: "خبر, اولین, مقاله",
      },
      // Add Arabic translation if needed
      // {
      //   newsId: newsItem1.id,
      //   locale: 'ar',
      //   title: '...',
      //   content: '...',
      //   excerpt: '...',
      // },
    ],
    skipDuplicates: true, // Avoid errors if translations already exist
  });

  console.log(`Created news item with translations: ${newsItem1.slug}`);

  // --- Seed Events with Translations ---
  const eventItem1 = await prisma.event.upsert({
    where: { slug: "community-gathering" },
    update: {},
    create: {
      slug: "community-gathering",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // One week from now
      time: "18:00",
      location: "Main Hall", // Assuming location is not translated
      image: "/placeholder.jpg",
    },
  });

  await prisma.eventTranslation.createMany({
    data: [
      {
        eventId: eventItem1.id,
        locale: "en",
        name: "Community Gathering",
        description: "Annual community gathering event.",
        metaTitle: "Community Gathering Event",
        metaDescription: "Join us for the annual community gathering.",
      },
      {
        eventId: eventItem1.id,
        locale: "fa",
        name: "گردهمایی عمومی",
        description: "رویداد گردهمایی سالانه عمومی.",
        metaTitle: "رویداد گردهمایی عمومی",
        metaDescription: "به ما در گردهمایی سالانه عمومی بپیوندید.",
      },
      // Add Arabic translation if needed
    ],
    skipDuplicates: true,
  });

  console.log(`Created event item with translations: ${eventItem1.slug}`);

  // --- Seed Programs with Translations ---
  const programItem1 = await prisma.program.upsert({
    where: { slug: "quran-recitation" },
    update: {},
    create: {
      slug: "quran-recitation",
      image: "/placeholder.jpg",
    },
  });

  await prisma.programTranslation.createMany({
    data: [
      {
        programId: programItem1.id,
        locale: "en",
        title: "Quran Recitation Class",
        description: "Learn the art of Quran recitation.",
        ageGroup: "Adults",
        schedule: "Tuesdays & Thursdays, 7 PM - 8 PM",
        metaTitle: "Quran Recitation Program",
        metaDescription: "Join our Quran recitation classes.",
        keywords: "quran, recitation, class, program",
      },
      {
        programId: programItem1.id,
        locale: "fa",
        title: "کلاس تلاوت قرآن",
        description: "هنر تلاوت قرآن را بیاموزید.",
        ageGroup: "بزرگسالان",
        schedule: "سه شنبه ها و پنجشنبه ها، ساعت 7 تا 8 شب",
        metaTitle: "برنامه تلاوت قرآن",
        metaDescription: "به کلاس های تلاوت قرآن ما بپیوندید.",
        keywords: "قرآن, تلاوت, کلاس, برنامه",
      },
      {
        programId: programItem1.id,
        locale: "ar",
        title: "درس تلاوة القرآن",
        description: "تعلم فن تلاوة القرآن.",
        ageGroup: "البالغون",
        schedule: "الثلاثاء والخميس، 7 مساءً - 8 مساءً",
        metaTitle: "برنامج تلاوة القرآن",
        metaDescription: "انضم إلى فصول تلاوة القرآن.",
        keywords: "قرآن, تلاوة, صف, برنامج",
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Created program item with translations: ${programItem1.slug}`);

  // --- Seed Gallery with Translations ---
  const galleryItem1 = await prisma.gallery.upsert({
    where: { id: "clxxxxxxgallery0001" }, // Keep using a fixed ID or generate one
    update: {},
    create: {
      id: "clxxxxxxgallery0001",
      image: "/gallery/image1.jpg",
      category: "Events", // Assuming category is not translated
    },
  });

  await prisma.galleryTranslation.createMany({
    data: [
      {
        galleryId: galleryItem1.id,
        locale: "en",
        title: "Event Highlights 1",
        description: "Photos from our recent event.",
      },
      {
        galleryId: galleryItem1.id,
        locale: "fa",
        title: "نکات برجسته رویداد ۱",
        description: "عکس هایی از رویداد اخیر ما.",
      },
      {
        galleryId: galleryItem1.id,
        locale: "ar",
        title: "أبرز الفعاليات 1",
        description: "صور من فعاليتنا الأخيرة.",
      },
    ],
    skipDuplicates: true,
  });

  const galleryItem2 = await prisma.gallery.upsert({
    where: { id: "clxxxxxxgallery0002" }, // Keep using a fixed ID or generate one
    update: {},
    create: {
      id: "clxxxxxxgallery0002",
      image: "/gallery/image2.jpg",
      category: "Architecture",
    },
  });

  await prisma.galleryTranslation.createMany({
    data: [
      {
        galleryId: galleryItem2.id,
        locale: "en",
        title: "Building Exterior",
        description: "View of the complex building.",
      },
      {
        galleryId: galleryItem2.id,
        locale: "fa",
        title: "نمای بیرونی ساختمان",
        description: "نمایی از ساختمان مجموعه.",
      },
      {
        galleryId: galleryItem2.id,
        locale: "ar",
        title: "واجهة المبنى",
        description: "منظر لمبنى المجمع.",
      },
    ],
    skipDuplicates: true,
  });

  console.log(
    `Created gallery items with translations: ${galleryItem1.id}, ${galleryItem2.id}`,
  );

  // --- Seed Contacts (Remains the same, no translations) ---
  const contact1 = await prisma.contact.create({
    data: {
      name: "Test Contact",
      email: "contact@example.com",
      subject: "Test Subject",
      message: "This is a test message.",
    },
  });
  console.log(`Created contact: ${contact1.name}`);

  // --- Seed Chat Bot Models ---

  // Create a chat
  const chat1 = await prisma.chat.create({
    data: {
      userId: user1.id,
      title: "First Chat",
    },
  });

  // Create messages in the chat
  const message1 = await prisma.message.create({
    data: {
      chatId: chat1.id,
      role: "USER",
      parts: JSON.stringify([{ type: "text", text: "Hello, this is a test message." }]),
      attachments: JSON.stringify([]),
    },
  });

  const message2 = await prisma.message.create({
    data: {
      chatId: chat1.id,
      role: "ASSISTANT",
      parts: JSON.stringify([{ type: "text", text: "Hello, this is a test response." }]),
      attachments: JSON.stringify([]),
    },
  });

  // Create a vote for a message
  await prisma.vote.create({
    data: {
      chatId: chat1.id,
      messageId: message2.id,
      isUpvoted: true,
    },
  });

  console.log(`Created chat with messages and a vote.`);

  // Create a document
  const document1 = await prisma.document.create({
    data: {
      Did: "doc-1",
      title: "Test Document",
      content: "This is the original content of the document.",
      userId: user1.id,
      kind: "TEXT",
    },
  });

  // Create a suggestion for the document
  await prisma.suggestion.create({
    data: {
      documentId: document1.id,
      documentCreatedAt: document1.createdAt,
      originalText: "original content",
      suggestedText: "updated content",
      description: "A suggestion to improve the content.",
      userId: user1.id,
    },
  });

  console.log(`Created a document and a suggestion.`);

  // --- Seed Payment ---
  await prisma.payment.create({
    data: {
      userId: user2.id,
      image: "/placeholder-payment.jpg",
      description: "Monthly donation",
      status: "APPROVED",
    },
  });

  console.log(`Created a payment record.`);

  console.log(`Seeding finished.`);
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
