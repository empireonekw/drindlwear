/** Standalone layout for sign-in and sign-up: a dotted ivory backdrop without the shop header. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[#fbf5f2] px-4 pb-16 pt-8 sm:px-6"
      style={{
        backgroundImage:
          "radial-gradient(rgb(120 29 45 / 9%) 1px, transparent 1px), radial-gradient(1200px 600px at 100% 100%, rgb(120 29 45 / 6%), transparent), radial-gradient(900px 500px at 0% 0%, rgb(217 182 182 / 22%), transparent)",
        backgroundSize: "22px 22px, auto, auto",
      }}
    >
      <main className="animate-page-enter">{children}</main>
    </div>
  );
}
