import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black font-mono">
      <main className="flex w-full max-w-3xl flex-col items-center justify-center p-8 text-center sm:p-16">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-6xl">
          Kyro Deployment Platform
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          A production-grade deployment platform built with Next.js, Drizzle,
          Better Auth, and more.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/login"
            className="rounded-md bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get started
          </Link>
          <a
            href="https://github.com/better-auth/better-auth"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold leading-6 text-zinc-900 dark:text-zinc-50"
          >
            Learn more <span aria-hidden="true">→</span>
          </a>
        </div>
      </main>
    </div>
  );
}
