import Link from "next/link";
import { Rocket } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-sm">
                <Rocket className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">Kyro</span>
            </Link>
            <p className="text-sm leading-6 text-muted-foreground">
              Deploy your apps globally with zero configuration. The seamless
              platform for modern development teams.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-foreground">
                  Product
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Integrations
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Changelog
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-foreground">
                  Support
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Guides
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      API Reference
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-foreground">
                  Company
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-foreground">
                  Legal
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-border/40 pt-8 sm:mt-20 lg:mt-24 flex items-center justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            &copy; {new Date().getFullYear()} Kyro Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
