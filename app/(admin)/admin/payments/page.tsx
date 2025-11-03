import { prisma } from "@/lib/prisma";
import PaymentsTable from "./_components/payments-table";

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: {
      user: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Manage Payments</h1>
      <PaymentsTable payments={payments} />
    </div>
  );
}
