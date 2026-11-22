import { BookOpenText, Bookmark, Languages, Search, SlidersHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const navItems = [
  { href: "/", icon: Search, ar: "البحث", en: "Search" },
  { href: "/saved", icon: Bookmark, ar: "المحفوظات", en: "Saved" },
  { href: "/sources", icon: SlidersHorizontal, ar: "المصادر", en: "Sources" },
];

export default function SiteShell({ children }: { children: ReactNode }) {
  const { isArabic, toggleLanguage } = useLanguage();
  const [location] = useLocation();

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand" aria-label="ScholarGate home">
            <span className="brand-mark" aria-hidden="true">
              <BookOpenText size={22} strokeWidth={2.1} />
              <span className="brand-lens" />
            </span>
            <span className="brand-name">Scholar<span>Gate</span></span>
          </Link>
          <nav className="desktop-nav" aria-label={isArabic ? "التنقل الرئيسي" : "Main navigation"}>
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`nav-link ${location === item.href ? "active" : ""}`}>
                  <Icon size={17} />
                  <span>{isArabic ? item.ar : item.en}</span>
                </Link>
              );
            })}
          </nav>
          <button className="language-button" onClick={toggleLanguage} type="button" aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}>
            <Languages size={17} />
            <span>{isArabic ? "English" : "العربية"}</span>
          </button>
        </div>
      </header>
      <main className="page-content">{children}</main>
      <footer className="site-footer">
        <span>ScholarGate <span className="footer-dot">·</span> {isArabic ? "ابحث بذكاء، ووصل إلى المصدر" : "Search clearly. Reach the source."}</span>
      </footer>
      <nav className="mobile-nav" aria-label={isArabic ? "التنقل" : "Navigation"}>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`mobile-nav-link ${location === item.href ? "active" : ""}`}>
              <Icon size={20} />
              <span>{isArabic ? item.ar : item.en}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
