import { Link } from "react-router-dom";
import { useCallback, useState } from "react";
import { BriefcaseBusiness, FileText, Map, Menu, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import appLogo from "@/assets/super_unemployed.webp";

const highlights = [
  {
    title: "Job Management",
    description: "Discover listings, track progress, and manage each application stage.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Interview Planner",
    description: "Schedule upcoming interviews and sync tracker statuses automatically.",
    icon: UserCheck,
  },
  {
    title: "Resume & Cover Letters",
    description: "Maintain ATS-friendly documents and export polished PDFs quickly.",
    icon: FileText,
  },
  {
    title: "Learning Roadmaps",
    description: "Build and share career path timelines with curated learning resources.",
    icon: Map,
  },
];

export function LandingPage() {
  const year = new Date().getFullYear();
  const [cursor, setCursor] = useState({ x: -9999, y: -9999, active: false });
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePointerMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setCursor({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      active: true,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setCursor((prev) => ({ ...prev, active: false }));
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
    <div
      className="relative min-h-screen scroll-smooth bg-slate-950 text-slate-100"
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage: "radial-gradient(rgba(148,163,184,0.45) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-150"
        style={{
          backgroundImage: "radial-gradient(rgba(34,211,238,1) 1.4px, transparent 1.4px)",
          backgroundSize: "24px 24px",
          opacity: cursor.active ? 1 : 0,
          WebkitMaskImage: `radial-gradient(260px circle at ${cursor.x}px ${cursor.y}px, black 0%, rgba(0,0,0,0.75) 45%, transparent 80%)`,
          maskImage: `radial-gradient(260px circle at ${cursor.x}px ${cursor.y}px, black 0%, rgba(0,0,0,0.75) 45%, transparent 80%)`,
        }}
      />
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <p className="flex items-center gap-2 text-base font-semibold sm:text-lg">
            <img src={appLogo} alt="Super Unemployed logo" className="h-7 w-7 rounded-sm object-cover" />
            <span>Super Unemployed</span>
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-slate-700 p-2 text-slate-200 transition hover:text-cyan-300 sm:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <nav className="hidden items-center gap-5 text-sm sm:flex">
            <a href="#home" className="text-slate-300 hover:text-cyan-300">
              Home
            </a>
            <a href="#feature" className="text-slate-300 hover:text-cyan-300">
              Feature
            </a>
            <a href="#about" className="text-slate-300 hover:text-cyan-300">
              About
            </a>
          </nav>
        </div>
        {menuOpen ? (
          <nav id="mobile-nav" className="border-t border-slate-800 bg-slate-950/95 px-4 py-3 sm:hidden">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 text-sm">
              <a href="#home" className="text-slate-300 hover:text-cyan-300" onClick={closeMenu}>
                Home
              </a>
              <a href="#feature" className="text-slate-300 hover:text-cyan-300" onClick={closeMenu}>
                Feature
              </a>
              <a href="#about" className="text-slate-300 hover:text-cyan-300" onClick={closeMenu}>
                About
              </a>
            </div>
          </nav>
        ) : null}
      </header>

      <main className="relative z-10 w-full">
        <section id="home" className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:py-10">
          <div className="mx-auto w-full max-w-6xl">
            <div className="px-2 py-6 sm:p-8 md:p-12">
              <div className="space-y-4 text-center sm:space-y-5">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Take control of your job search journey</h1>
                <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
                  Super Unemployed keeps your job listings, tracker board, interviews, resume exports, and growth roadmaps in one focused workspace.
                </p>
                <div className="flex flex-col items-stretch justify-center gap-3 pt-3 sm:flex-row sm:items-center">
                  <Button asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/auth">Login</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="feature" className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:py-10">
          <div className="mx-auto w-full max-w-6xl space-y-5">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">Features</h2>
              <p className="text-sm text-slate-300 sm:text-base">Everything you need for job hunting and career planning.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="space-y-2 p-4 sm:p-6">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-cyan-300" />
                      <h2 className="text-base font-semibold sm:text-lg">{item.title}</h2>
                    </div>
                    <p className="text-sm text-slate-300">{item.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:py-10">
          <div className="mx-auto max-w-3xl space-y-3 text-center sm:space-y-4">
            <h2 className="text-2xl font-bold sm:text-3xl">About</h2>
            <p className="text-sm text-slate-300 sm:text-base">
              Built for serious applicants who want structure, visibility, and momentum. Plan your path, track progress, and stay consistent from first
              application to final offer.
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-800 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-400">
          © {year} Super Unemployed. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
