"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function PrivacyPage() {
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
      } catch (e) {
        setError("An error occurred while loading content.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6">
        <a href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
          ← Back to Home
        </a>
      </div>
      <h1 className="text-3xl font-bold mb-6">{content?.title || "Privacy Policy"}</h1>
      <div
        className="prose max-w-none prose-slate"
        dangerouslySetInnerHTML={{ __html: content?.content }}
      />
      <div className="mt-8 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Last updated: {content?.updated_at ? new Date(content.updated_at).toLocaleDateString() : 'N/A'}
        </p>
      </div>
    </div >
  );
}
