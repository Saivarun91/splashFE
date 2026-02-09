"use client";

import { useEffect, useState } from "react";
import { MoveLeft, ShieldCheck, Lock, Database, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/home/Navigation";
import { apiService } from "@/lib/api";

const iconMap = [ShieldCheck, Lock, Database, UserCheck];

export default function SecurityPage() {
  const router = useRouter();
  const [content, setContent] = useState(null);

  useEffect(() => {
    apiService.getPageContent("security").then(setContent).catch(() => setContent({}));
  }, []);

  const header = content?.header || {};
  const cards = content?.cards || [
    { title: "Infrastructure Security", description: "Splash AI Studio runs on secure, cloud-based infrastructure with industry-standard firewalls, network isolation, and continuous monitoring to prevent unauthorized access." },
    { title: "Data Encryption", description: "All data is encrypted in transit using HTTPS/TLS and encrypted at rest using modern encryption standards to ensure confidentiality and integrity." },
    { title: "Data Ownership", description: "You retain full ownership of all images, uploads, and generated assets. Splash AI never sells or shares your content with third parties." },
    { title: "Access Control", description: "Role-based access controls allow teams to collaborate securely with defined permissions for Owners, Editors, and Viewers." },
  ];
  const compliance = content?.compliance || {};
  const cta = content?.cta || {};

  return (
    <>
    <Navigation />
    <div className="min-h-screen bg-white text-[#0c1421]">
      <section className="relative py-20 md:py-32 overflow-hidden bg-[#f8f9fc]">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-500">
            {header.title || "Security & Data Protection"}
          </h1>
          <p className="text-lg md:text-xl text-[#313957] max-w-3xl mx-auto leading-relaxed">
            {header.subtitle || "Your data, designs, and intellectual property are protected with enterprise-grade security at every level."}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
          {cards.map((card, i) => {
            const Icon = iconMap[i] || ShieldCheck;
            return (
              <div key={i} className="border border-[#e6e6e6] rounded-2xl p-8 hover:shadow-lg transition">
                <Icon className="w-10 h-10 text-[#5533ff] mb-4" />
                <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                <p className="text-lg text-[#313957] leading-relaxed">{card.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-16 bg-[#f8f9fc]">
        <div className="max-w-screen-md mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {compliance.heading || "Compliance & Best Practices"}
          </h2>
          {(compliance.paragraphs || [
            "Splash AI Studio follows globally recognized best practices for data protection, privacy, and secure software development.",
            "We continuously review and improve our security posture to stay aligned with evolving industry standards.",
          ]).map((p, i) => (
            <p key={i} className="text-lg text-[#313957] leading-relaxed mb-4">{p}</p>
          ))}
        </div>
      </section>

      <section className="py-20 bg-[#0c1421] text-white text-center">
        <div className="max-w-screen-md mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {cta.title || "Have security questions?"}
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            {cta.subtitle || "Our team is happy to answer any security or compliance questions you may have."}
          </p>
          <button
            onClick={() => router.push("/contact")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#5533ff] font-bold text-lg hover:bg-gray-100 transition"
          >
            {cta.button_text || "Contact Security Team"}
          </button>
        </div>
      </section>

      {/* Back Button
      <button
        onClick={() => router.push("/")}
        className="fixed top-10 left-6 z-50
                   bg-white/80 backdrop-blur-sm border border-gray-200
                   hover:bg-gray-100
                   px-4 py-2 rounded-full shadow-sm transition-all flex items-center gap-2"
      >
        <MoveLeft size={16} /> Back
      </button> */}
    </div>
    </>
  );
}
