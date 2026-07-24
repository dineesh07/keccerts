"use client";

import { usePathname } from "next/navigation";
import { Heart, ExternalLink, ShieldCheck } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  const handleScroll = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__container">
        <div className="footer__top">
          <div className="footer__brand-col">
            <h3 className="footer__title">Kongu Engineering College</h3>
            <p className="footer__subtitle">Coding Club · Department of CT-PG</p>
            <p className="footer__desc">
              Official Student Certificate Portal for verified contest participation records & instant certificate generation.
            </p>
          </div>

          <div className="footer__links-col">
            <span className="footer__nav-heading">Quick Links</span>
            <div className="footer__nav-links">
              <a href="/#search" onClick={handleScroll("search")} className="footer__link">
                Search Certificates
              </a>
              <a href="/#events" onClick={handleScroll("events")} className="footer__link">
                Contests & Events
              </a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            &copy; {year} Kongu Engineering College. All rights reserved.
          </p>

          <p className="footer__designer">
            Designed with <Heart size={13} className="footer__heart-icon" aria-label="love" /> by{" "}
            <a
              href="https://dineeshm.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__designer-link"
            >
              Dineesh M <ExternalLink size={12} className="footer__ext-icon" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
