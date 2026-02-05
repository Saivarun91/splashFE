import Link from "next/link";
import { Instagram, Twitter, Linkedin } from "lucide-react";

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
  return (
    <footer className="border-t border-gray-300 bg-white">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="mb-4 block">
              <img
                src="/images/logo-splash.png"
                alt="Splash AI Studio"
                className="h-48 w-auto object-contain hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <p className="text-sm text-black mb-6 max-w-xs">
              Campaign Ready Visuals with AI.
            </p>

            {/* Social Icons */}
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram size={18} className="text-black" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label="Twitter"
              >
                <Twitter size={18} className="text-black" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} className="text-black" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4 text-sm text-black">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-black hover:text-gray-700 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-300 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-black">
            © 2026 Splash AI Studio. All rights reserved.
          </p>
          {/* <p className="text-sm text-black">
            Made with precision and care.
          </p> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
