import { Footer, Header } from "@/components/site";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="motion-safe:[&>*]:animate-page-enter motion-safe:[&>:nth-child(2)]:[animation-delay:70ms] motion-safe:[&>:nth-child(3)]:[animation-delay:120ms]">{children}</main>
      <Footer />
    </>
  );
}