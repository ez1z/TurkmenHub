import { getTranslations } from "next-intl/server";
import PolicyPage from "@/components/policy-page";

export async function generateMetadata() {
  const t = await getTranslations("privacy");
  return { title: `${t("title")} · TurkmenHub` };
}

// Public: the proxy lets anyone read it, signed in or not.
export default function PrivacyPage() {
  return <PolicyPage namespace="privacy" sections={["stored", "seen", "kept", "delete"]} />;
}
