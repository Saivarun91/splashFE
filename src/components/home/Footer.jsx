import Link from "next/link";
import { Instagram, Twitter, Linkedin } from "lucide-react";
import { useState } from "react";
import { FooterContactModal } from "./FooterContactModal";

const defaultFooterLinks = {
  Platform: [
    { label: "Features", href: "/#product" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Showcase", href: "/#showcase" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Tutorials", href: "/tutorials" },
    { label: "FAQs", href: "/faqs" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Vision & Mission", href: "/vision-mision" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Security & Data Protection", href: "/security" },
  ],
};

const Footer = ({ footer: footerContent }) => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const footerLinks = footerContent?.links && Object.keys(footerContent.links).length ? footerContent.links : defaultFooterLinks;
  const logoUrl = footerContent?.logo_url ?? "/images/logo-splash.png";
  const tagline = footerContent?.tagline ?? "Campaign-ready visuals powered by AI.";
  const copyrightText = footerContent?.copyright ?? "© 2026 Splash AI Studio. All rights reserved.";

  return (
    <footer id="site-footer" className="border-t border-border bg-card/50">
      <FooterContactModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
      />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-14 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12 mb-10">
          <div className="col-span-2">
            <Link href="/" className="block mb-4">
              <img
                src={logoUrl}
                alt="Splash AI Studio"
                className="h-32 md:h-40 w-auto object-contain hover:scale-105 transition-transform duration-300"
              />
            </Link>

            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              {tagline}
            </p>

            <div className="flex gap-4">
              {[Instagram, Twitter, Linkedin].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-10 h-10 bg-gold-gradient rounded-full border border-gold-muted flex items-center justify-center hover:brightness-110 transition"
                >
                  <Icon className="w-[18px] h-[18px] text-primary-foreground" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm sm:text-base mb-4 text-gold-solid">
                {category}
              </h3>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm sm:text-base text-muted-foreground hover:text-gold-solid transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
