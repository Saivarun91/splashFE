"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { Loader2, MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/home/Navigation";
export default function PrivacyPage() {
  const router = useRouter();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await apiService.getLegalContent("privacy");
        if (res?.content) {
          setContent(res.content);
        } else {
          setError("Failed to load content.");
        }
      } catch {
        setError("An error occurred while loading content.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <>
      <Navigation />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[#5533ff]" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-red-500">
        {error}
      </div>
    );
  }

  return (
    <>
    <Navigation />
    <div className="min-h-screen bg-white text-[#0c1421]">
      {/* Page Header */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-[#f8f9fc]">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

        <div className="max-w-screen-lg mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-500">
            {content?.title || "Privacy Policy"}
          </h1>

          <p className="text-lg md:text-xl text-[#313957] max-w-2xl mx-auto leading-relaxed">
            Your privacy matters to us.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-screen-lg mx-auto px-6">
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-8 md:p-12 shadow-sm">
            <div
              className="prose prose-lg max-w-none
                         prose-headings:text-[#0c1421]
                         prose-p:text-[#313957]
                         prose-li:text-[#313957]
                         prose-strong:text-[#0c1421]"
              dangerouslySetInnerHTML={{ __html: content?.content }}
            />

            <div className="mt-12 pt-6 border-t border-[#e6e6e6] text-sm text-gray-500">
              Last updated:{" "}
              {content?.updated_at
                ? new Date(content.updated_at).toLocaleDateString()
                : "N/A"}
            </div>
          </div>
        </div>
      </section>

      {/* Back Button */}
      {/* <button
        onClick={() => router.push("/")}
        className="fixed top-10 left-6 z-50
                   bg-white/80 backdrop-blur-sm border border-gray-200
                   hover:bg-gray-100 hover:text-black
                   px-4 py-2 rounded-full shadow-sm transition-all
                   flex items-center gap-2"
      >
        <MoveLeft size={16} /> Back
      </button> */}
    </div>
    </>
    
  );
}
