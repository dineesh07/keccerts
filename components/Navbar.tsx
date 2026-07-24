"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export function Navbar() {
  return (
    <header className="navbar" role="banner">
      <div className="navbar__inner">
        {/* Logo / Brand */}
        <a href="/" className="navbar__brand" aria-label="Kongu Engineering College Certificate Portal home">
          <div className="navbar__logo-mark">
            <Image
              src="/logo.png"
              alt="Kongu Engineering College & Coding Club Logo"
              width={340}
              height={95}
              className="navbar__logo-img"
              priority
            />
          </div>
          <div className="navbar__brand-text">
            <span className="navbar__brand-name">Certificate Portal</span>
            <span className="navbar__brand-sub">Kongu Engineering College</span>
          </div>
        </a>

        {/* Right side info */}
        <div className="navbar__right">
          <span className="navbar__badge">Academic Year 2026–27</span>
        </div>
      </div>
    </header>
  );
}
