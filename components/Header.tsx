import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-orange-500 to-amber-600" />
          <span className="text-xs md-text-lg font-semibold">OpenSesame Internship</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium transition text-gray-700 hover:bg-white hover:text-orange-600">Home</Link>
          <Link href="/about" className="px-4 py-2 rounded-lg text-sm font-medium transition text-gray-700 hover:bg-white hover:text-orange-600">About</Link>
          <Link href="/demo" className="px-4 py-2 rounded-lg text-sm font-medium transition text-gray-700 hover:bg-white hover:text-orange-600">Demo</Link>
        </nav>
      </div>
    </header>
  );
}

