import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import StoreBuilderWizard from "@/components/StoreBuilderWizard";

export default async function ConsolePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const role = (session as any).role;
  const xUsername = (session as any).xUsername;

  // Admin goes to store list
  if (role === "admin") {
    redirect("/console/stores");
  }

  // Creator flow — store builder wizard
  return (
    <div className="py-8">
      <StoreBuilderWizard xUsername={xUsername || undefined} />
    </div>
  );
}
