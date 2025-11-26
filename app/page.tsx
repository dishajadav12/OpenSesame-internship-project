import Link from "next/link";

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-white/90 rounded-2xl shadow-lg ring-1 ring-black/5 p-8 transition hover:shadow-xl hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        <div className="h-8 md:h-10 w-8 md-w-10 flex-none rounded-lg bg-gradient-to-br from-orange-500 to-amber-600" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{desc}</p>
        </div>
        <div className="flex-none">
          <span className="text-orange-600 group-hover:translate-x-0.5 inline-block transition">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="px-4 pb-16">
      <section className="pt-12 pb-8 max-w-3xl mx-auto text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Disha Jadav 
        </h1>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-2">
          OpenSesame Internship Project
        </h1>
        <p className="mt-3 text-gray-600">
          This mini site is my creative project for the OpenSesame Engineering
          Internship. It includes a short introduction with my answers to the
          application questions and a small AI-powered demo that explores how
          we might support learners with personalized roadmaps.
        </p>
      </section>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
        <Card
          title="About & Answers"
          desc="Learn more about who I am, what I care about, and how I see myself contributing to OpenSesame’s mission."
          href="/about"
        />
        <Card
          title="AI Demo: Learning Roadmap"
          desc="Try a small prototype that uses the Gemini API to generate a 4-week learning roadmap based on a learner’s goals."
          href="/demo"
        />
      </div>
    </main>
  );
}
