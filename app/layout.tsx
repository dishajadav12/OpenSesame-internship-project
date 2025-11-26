import "./globals.css";
import Header from "../components/Header";

export const metadata = {
  title: "OpenSesame Internship Micro-Site",
  description: "Next.js + TypeScript + Tailwind"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className=" bg-orange-50 text-gray-900">
        <Header />
        <div className="max-w-5xl mx-auto px-4">{children}</div>
      </body>
    </html>
  );
}

