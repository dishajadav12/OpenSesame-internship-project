'use client';
import React from "react";

function Q({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  const contentId = React.useId();

  return (
    <div className="bg-white/90 rounded-2xl shadow ring-1 ring-black/5">
      <button
        type="button"
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <div className="pr-4">
          <h3 className="font-semibold">{q}</h3>
        </div>
        <span
          className={`inline-block transform transition-transform duration-200 ${
            open ? "rotate-90" : ""
          } text-gray-500`}
        >
          ▶
        </span>
      </button>

      <div
        id={contentId}
        className={`px-6 pb-4 transition-[max-height,opacity] duration-200 ease-out overflow-hidden ${
          open ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-gray-700 leading-relaxed whitespace-pre-line pt-1">
          {a}
        </p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="md:px-4 py-12">
      <section className="mb-8 md:max-w-7xl md-mx-auto mx-2 mr-4  md:text-center">
        <h2 className="text-xl sm:text-2xl font-bold">About Me</h2>
        <p className="mt-2 text-gray-700  md-mx-14">
          My name is Disha Jadav, and I’m currently pursuing my master’s in
          Software Engineering at San José State University. I’m a full stack
          developer who loves building things that genuinely help people. Over
          the past year, I’ve developed end to end features, contributed to real
          production systems, and explored how AI can make learning and everyday
          tasks easier.
          <br />
          <br />
          I’m also actively involved in hackathons and tech events, where I push
          myself to learn fast, collaborate with new people, and turn ideas into
          working prototypes. What draws me to OpenSesame is the opportunity to
          build tools that directly support learners who want to grow their
          skills and advance in their careers. Creating software that has a
          meaningful, positive impact on people’s growth is the direction I want
          my career to continue moving toward.
        </p>
      </section>

      <section className="space-y-6 md-max-w-4xl md-mx-10">
        <h3 className="text-lg text-center sm:text-2xl font-bold mb-4">
  Application Questions & My Answers
</h3>
        <Q
          q="How does OpenSesame fit your career journey or long term goals?"
          a={`I see OpenSesame fitting into my long term goals because I want to build software that makes learning easier, more accessible, and more meaningful for people. Long term, my goal is to work on products that help people build new skills and advance in their careers, and that is exactly what OpenSesame focuses on.

As a graduate student and full stack developer, I have spent the last year building features end to end and solving real problems for users. The engineering work at OpenSesame matches the type of challenges I want to keep solving: thoughtful user experiences, reliable systems, and products that genuinely help people.

Joining OpenSesame would support my long term goal of becoming an engineer who builds impactful tools for learners, while giving me the chance to contribute to a platform that improves career growth for thousands of people.`}
        />

        <Q
          q="What strengths, skills, or perspectives will you bring?"
          a={`I bring strong full stack engineering skills along with a genuine love for solving problems creatively. In my previous role, I was often in UI/UX discussions even more than developer meetings, which helped me develop a solid understanding of design principles, user flows, and how interfaces should feel in practice. That background makes me thoughtful about usability and clarity when building features.

Technically, I am proficient in TypeScript, React, Node.js, PostgreSQL, and building end to end features that move from idea to production. I enjoy breaking down complex requirements into simple, intuitive components and turning concepts into working prototypes quickly.

Beyond technical skills, I work well with others, communicate clearly, and adapt easily. I’m a fast learner, a multitasker, and someone who stays calm under pressure. I enjoy collaborating across roles and improving things based on real feedback, which aligns well with an XP style engineering culture.`}
        />

        <Q
          q="What excites you about AI, and how can it shape the future of learning and work?"
          a={`What excites me most about AI is how quickly it has become a part of everyday life. It still amazes me to see people who never thought about technology relying on AI tools for daily tasks, learning new topics, or simply getting unstuck. Watching AI make things easier, faster, and more accessible for people of all backgrounds motivates me to be part of building those kinds of systems.

For the future of learning and work, I believe AI can open doors for people who might not have had access to certain opportunities before. It can guide learners who don’t know where to start, adapt to different learning styles, and support people in multiple languages. Used responsibly, AI can help instructors and teams scale their impact instead of replacing them. I’m excited about designing tools where AI enhances human decision-making, creates more personalized learning experiences, and helps OpenSesame reach even more learners around the world.`}
        />
      </section>
    </main>
  );
}
