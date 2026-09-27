import { useTranslations } from "next-intl";

export default function IntellectualPropertyNoticePage() {
  const t = useTranslations("legal");
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="font-heading text-3xl font-bold mb-8">{t("ipNotice")}</h1>
      <div className="prose prose-slate max-w-none space-y-4">
        <p className="font-semibold">INTELLECTUAL PROPERTY NOTICE</p>
        <p>All software, website content, platform features, designs, interfaces, graphics, databases, workflows, algorithms, APIs, documentation, trademarks, product names, models and other digital assets made available through this website or platform are owned by or licensed to One Tech and AI.</p>
        <p>Access to the website or service does not transfer ownership or intellectual property rights to the user. Except where expressly permitted in writing, no part of the software, platform or associated digital assets may be copied, reproduced, modified, distributed, published, reverse engineered, scraped, sublicensed, commercially exploited or incorporated into another product or service, subject to applicable law.</p>
        <p>All rights are reserved.</p>
      </div>
    </div>
  );
}
