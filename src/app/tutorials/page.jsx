"use client";

import { useEffect, useState } from "react";
import { MoveLeft, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/home/Navigation";
import { apiService } from "@/lib/api";

const defaultTutorials = [
  { title: "Getting Started with Splash AI", description: "Learn how to create your first AI-generated fashion image in under 2 minutes.", youtube_id: "VIDEO_ID_1" },
  { title: "Using Your Own Model Photos", description: "Upload human model images and generate studio-quality fashion visuals.", youtube_id: "VIDEO_ID_2" },
  { title: "Campaign Image Generation", description: "Create high-conversion campaign creatives for ads, banners, and social media.", youtube_id: "VIDEO_ID_3" },
  { title: "Team Collaboration & Roles", description: "Invite your team, assign roles, and collaborate efficiently.", youtube_id: "VIDEO_ID_4" },
];

export default function TutorialsPage() {
  const router = useRouter();
  const [content, setContent] = useState(null);

  useEffect(() => {
    apiService.getPageContent("tutorials").then(setContent).catch(() => setContent({}));
  }, []);

  const header = content?.header || {};
  const videos = content?.videos?.length ? content.videos : defaultTutorials;
  const cta = content?.cta || {};

  return (
    <>
    <Navigation />
    <div className="min-h-screen bg-white text-[#0c1421]">
      <section className="relative py-20 md:py-32 overflow-hidden bg-[#f8f9fc]">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-500">
            {header.title || "Tutorials"}
          </h1>
          <p className="text-lg md:text-xl text-[#313957] max-w-2xl mx-auto leading-relaxed">
            {header.subtitle || "Step-by-step video guides to help you master Splash AI Studio"}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
          {videos.map((video, index) => (
            <div
              key={index}
              className="bg-white border border-[#e6e6e6] rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Video */}
              <div className="relative aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtube_id || video.youtubeId || ""}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full rounded-t-2xl"
                />
              </div>

              {/* Content */}
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <PlayCircle className="w-6 h-6 text-[#5533ff]" />
                  <h3 className="text-xl font-bold">
                    {video.title}
                  </h3>
                </div>
                <p className="text-[#313957] text-lg leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-[#0c1421] text-white text-center">
        <div className="max-w-screen-md mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {cta.title || "Want more advanced tutorials?"}
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            {cta.subtitle || "We regularly add new walkthroughs covering advanced workflows and campaign strategies."}
          </p>
          <button
            onClick={() => router.push("/contact")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#5533ff] font-bold text-lg hover:bg-gray-100 transition"
          >
            {cta.button_text || "Request a Tutorial"}
          </button>
        </div>
      </section>

      {/* Back Button (Same Pattern Everywhere) */}
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
