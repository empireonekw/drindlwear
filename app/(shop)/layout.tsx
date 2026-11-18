import { ChatWidget } from "@/components/chat-widget";
import { Footer, Header } from "@/components/site";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="motion-safe:[&>*]:animate-page-enter motion-safe:[&>:nth-child(2)]:[animation-delay:30ms] motion-safe:[&>:nth-child(3)]:[animation-delay:60ms]">{children}</main>
      <Footer />
      <ChatWidget />
    </>
  );
}