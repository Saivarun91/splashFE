import Link from "next/link";
import { Instagram, Twitter, Linkedin } from "lucide-react";
import { useState } from "react";
import { FooterContactModal } from "./FooterContactModal";

/**
 * Quick links: hrefs point to home anchors or app routes.
 * Placeholder pages (replace with real content when ready):
 *   /about, /blog, /careers, /contact, /roadmap,
 *   /documentation, /help, /api-reference, /community,
 *   /privacy, /terms, /cookies
 */
const footerLinks = {
  Product: [
    { label: "Features", href: "/#product" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Case Studies", href: "/#showcase" },
    { label: "Roadmap", href: "/roadmap" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Resources: [
    { label: "Documentation", href: "/documentation" },
    { label: "Help Center", href: "/help" },
    { label: "API Reference", href: "/api-reference" },
    { label: "Community", href: "/community" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};


const Footer = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <footer id="site-footer" className="border-t border-gray-300 bg-white">
      <FooterContactModal open={isContactModalOpen} onOpenChange={setIsContactModalOpen} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 md:py-16 lg:py-20">
        {/* Mobile: Stacked, Tablet+: Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
          {/* Brand - Mobile: Full width, Desktop: 2 columns */}
          <div className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-2">
            <Link href="/" className="mb-3 sm:mb-4 block">
              <img
                src="/images/logo-splash.png"
                alt="Splash AI Studio"
                className="h-32 sm:h-40 md:h-48 w-auto object-contain hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <p className="text-xs sm:text-sm text-black mb-4 sm:mb-6 max-w-xs">
              Campaign Ready Visuals with AI.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3 sm:gap-4">
              <a
                href="#"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram size={16} className="sm:w-[18px] sm:h-[18px] text-black" />
              </a>
              <a
                href="#"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label="Twitter"
              >
                <Twitter size={16} className="sm:w-[18px] sm:h-[18px] text-black" />
              </a>
              <a
                href="#"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <Linkedin size={16} className="sm:w-[18px] sm:h-[18px] text-black" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm text-black">{category}</h3>
              <ul className="space-y-2 sm:space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.label === "Contact" ? (
                      // <button
                        
                      //   className="text-xs sm:text-sm text-black hover:text-gray-700 transition-colors text-left"
                      // >
                      //   {link.label}
                      // </button>
                      <Link
                        href={link.href}
                        className="text-xs sm:text-sm text-black hover:text-gray-700 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-xs sm:text-sm text-black hover:text-gray-700 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 border-t border-gray-300 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-black text-center sm:text-left">
            © 2026 Splash AI Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
