"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/home/Navigation";

const faqs = [
  {
    question: "How many credits does each generation cost?",
    answer:
      "Plain images cost 2 credits, themed images cost 8 credits, model images cost 12 credits, and campaign images cost 15 credits.",
  },
  {
    question: "Can I use my own model photos?",
    answer:
      "Yes! You can upload human model photos with plain backgrounds and front or 3/4 angle poses for best results.",
  },
  {
    question: "How long does image generation take?",
    answer:
      "Plain images take 2–3 seconds, themed images 3–4 seconds, model images 4–5 seconds, and campaign images 5–6 seconds.",
  },
  {
    question: "Can I collaborate with team members?",
    answer:
      "Yes! You can invite collaborators to your projects with Owner, Editor, or Viewer permissions.",
  },
];

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const router = useRouter();

  return (
    <>
    <Navigation />
    <div className="min-h-screen bg-white text-[#0c1421]">
      
      {/* 1. Page Header (Same as About) */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-[#f8f9fc]">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-500">
            Frequently Asked Questions
          </h1>
          <p className="text-lg md:text-xl text-[#313957] max-w-2xl mx-auto leading-relaxed">
            Quick answers to common questions about Splash AI Studio
          </p>
        </div>
      </section>

      {/* 2. FAQ Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-screen-md mx-auto px-6 space-y-6">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="bg-white border border-[#e6e6e6] rounded-2xl p-6 md:p-8 transition-shadow hover:shadow-lg"
              >
                <button
                  onClick={() =>
                    setOpenIndex(isOpen ? null : index)
                  }
                  className="w-full flex items-center justify-between text-left gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-[#f0f2f5] text-[#5533ff]">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold">
                      {faq.question}
                    </h3>
                  </div>

                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <p className="mt-6 text-[#313957] text-lg leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Dark CTA Section (Matches Purpose/Vision block) */}
      <section className="py-20 bg-[#0c1421] text-white text-center">
        <div className="max-w-screen-md mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Still have questions?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Our team is happy to help you understand how Splash AI Studio fits your workflow.
          </p>
          <button
            onClick={() => router.push("/contact")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#5533ff] font-bold text-lg hover:bg-gray-100 transition"
          >
            Contact Us
          </button>
        </div>
      </section>

      {/* Back Button (Same Pattern as About) */}
      {/* <button
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
