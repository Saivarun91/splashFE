"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, Upload, Cpu, Users, Ruler, Zap, Loader2, CheckCircle, AlertCircle, RefreshCw, X, Download, Eye, Coins } from "lucide-react"
import { MdPhotoSizeSelectLarge } from "react-icons/md"
import { apiService } from "@/lib/api"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { OrnamentSelection } from "@/components/images/OrnamentSelection"
import { DimensionsSelector } from "@/components/images/DimensionsSelector"
import { NumberOfImagesSelector } from "@/components/images/NumberOfImagesSelector"
import { ReferenceImagesModal } from "@/components/images/ReferenceImagesModal"
import toast from "react-hot-toast"
import { openImageViewer } from "@/lib/openImageViewer"
import { HiOutlineUserCircle } from "react-icons/hi";
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_IMAGES = 1;
const MAX_IMAGES = 3;

export default function ModelGenerationForm() {
    const router = useRouter()
    // AI upload errors
const [aiUploadErrors, setAiUploadErrors] = useState({
    ornamentImage: null,
    poseImage: null,
  });
  
  // Real upload errors
  const [realUploadErrors, setRealUploadErrors] = useState({
    modelImage: null,
    ornamentImage: null,
    poseImage: null,
  });
  
    const { token } = useAuth()
    const { t } = useLanguage()
    const [activeTab, setActiveTab] = useState("ai_model") // "ai_model" or "real_model"
    const [numImages, setNumImages] = useState(1)
    const [creditSettings, setCreditSettings] = useState({ credits_per_image_generation: 2 })
    const [showCostNote, setShowCostNote] = useState(false)
    const generateSectionRef = useRef(null)

    useEffect(() => {
        let cancelled = false
        apiService.getImageCreditSettings(token).then((s) => {
            if (!cancelled && s) setCreditSettings(s)
        })
        return () => { cancelled = true }
    }, [token])

    useEffect(() => {
        if (!showCostNote) return
        const handleClickOutside = (e) => {
            if (generateSectionRef.current && !generateSectionRef.current.contains(e.target)) {
                setShowCostNote(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("touchstart", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchstart", handleClickOutside)
        }
    }, [showCostNote])
    const [showReferenceModal, setShowReferenceModal] = useState(false)
    const getUserFriendlyError = (error) => {
        if (error.response) {
            const status = error.response.status;
    
            switch (status) {
                case 400:
                    return "Some information seems incorrect. Please check your inputs and try again.";
    
                case 401:
                    return "Your session has expired. Please log in again.";
    
                case 403:
                    return "You don’t have permission to perform this action.";
    
                case 404:
                    return "Requested resource was not found.";
    
                case 413:
                    return "The uploaded file is too large. Please upload a smaller image.";
    
                case 422:
                    return "Please make sure all required fields are filled correctly.";
    
                case 500:
                    return "Something went wrong on our side. Please try again in a few moments.";
    
                default:
                    return "An unexpected error occurred. Please try again.";
            }
        }
    
        if (error.request) {
            return "Network issue detected. Please check your internet connection.";
        }
    
        return "Something went wrong. Please try again.";
    };
    
    // AI Model State
    const [aiFormData, setAiFormData] = useState({
        ornamentImage: null,
        poseImage: null,
        prompt: "",
        measurements: "",
        dimension: "1:1",
    })
    const [aiOrnamentType, setAiOrnamentType] = useState("")
    const [aiOrnamentMeasurements, setAiOrnamentMeasurements] = useState({})
    const [aiOrnamentPreview, setAiOrnamentPreview] = useState(null)
    const [aiPosePreview, setAiPosePreview] = useState(null)
    const [aiReferenceAnalysis, setAiReferenceAnalysis] = useState("")
    const [aiResult, setAiResult] = useState(null)
    const [aiError, setAiError] = useState(null)
    const [aiIsLoading, setAiIsLoading] = useState(false)
    const [aiRegenerateModal, setAiRegenerateModal] = useState({
        isOpen: false,
        prompt: '',
        loading: false,
        error: null,
        image: null
    })

    // Real Model State
    const [realFormData, setRealFormData] = useState({
        modelImage: null,
        ornamentImage: null,
        poseImage: null,
        prompt: "",
        measurements: "",
        dimension: "1:1",
    })
    const [realOrnamentType, setRealOrnamentType] = useState("")
    const [realOrnamentMeasurements, setRealOrnamentMeasurements] = useState({})
    const [realModelPreview, setRealModelPreview] = useState(null)
    const [realOrnamentPreview, setRealOrnamentPreview] = useState(null)
    const [realPosePreview, setRealPosePreview] = useState(null)
    const [realReferenceAnalysis, setRealReferenceAnalysis] = useState("")
    const [realResult, setRealResult] = useState(null)
    const [realError, setRealError] = useState(null)
    const [realIsLoading, setRealIsLoading] = useState(false)
    const [realRegenerateModal, setRealRegenerateModal] = useState({
        isOpen: false,
        prompt: '',
        loading: false,
        error: null,
        image: null
    })

    const handleView = (selectedImage = null) => {
        const generatedImages =
            currentState.result?.images && currentState.result.images.length > 0
                ? currentState.result.images
                : currentState.result?.generated_image_url
                  ? [currentState.result]
                  : []

        const viewerItems = generatedImages.map((img, idx) => ({
            url: img.generated_image_url,
            label: `Image ${idx + 1}`
        }))

        const activeIndex = selectedImage
            ? generatedImages.findIndex((img) => {
                if (selectedImage.mongo_id && img.mongo_id) {
                    return img.mongo_id === selectedImage.mongo_id
                }
                return img.generated_image_url === selectedImage.generated_image_url
            })
            : 0

        openImageViewer(viewerItems, activeIndex >= 0 ? activeIndex : 0)
    };

    const downloadImage = async (url, filename = "image.png") => {
        try {
            // First try with fetch and blob approach
            const response = await fetch(url, {
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            link.style.display = 'none';
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();

            // Clean up after a delay
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }, 200);

            toast.success(t("images.downloadStarted"));
        } catch (error) {
            console.error('Error downloading image:', error);
            // Fallback: try direct download link
            try {
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                link.target = '_blank';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                }, 200);
                toast.success(t("images.downloadStarted"));
            } catch (fallbackError) {
                console.error('Fallback download also failed:', fallbackError);
                // Last resort: open in new tab
                window.open(url, '_blank');
                toast.error(t("images.downloadFailed"));
            }
        }
    };

    // Get current state based on active tab
    const getCurrentState = () => {
        if (activeTab === "ai_model") {
            return {
                result: aiResult,
                isLoading: aiIsLoading,
                error: aiError,
                regenerateModal: aiRegenerateModal,
                setRegenerateModal: setAiRegenerateModal
            }
        } else {
            return {
                result: realResult,
                isLoading: realIsLoading,
                error: realError,
                regenerateModal: realRegenerateModal,
                setRegenerateModal: setRealRegenerateModal
            }
        }
    }

    const currentState = getCurrentState()

    // AI Model Handlers
    const handleAiFileChange = (type, file, inputEl) => {
        if (!file) return;
      
        setAiUploadErrors((p) => ({ ...p, [type]: null }));
      
        if (file.size > MAX_IMAGE_BYTES) {
          setAiUploadErrors((p) => ({
            ...p,
            [type]: "File size exceeded. Max 10MB allowed.",
          }));
          if (inputEl) inputEl.value = "";
          return;
        }
      
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          setAiUploadErrors((p) => ({
            ...p,
            [type]: "Only JPG, PNG or WEBP images allowed.",
          }));
          if (inputEl) inputEl.value = "";
          return;
        }
      
        setAiFormData((prev) => ({ ...prev, [type]: file }));
      
        const reader = new FileReader();
        reader.onloadend = () => {
          type === "ornamentImage"
            ? setAiOrnamentPreview(reader.result)
            : setAiPosePreview(reader.result);
        };
        reader.readAsDataURL(file);
        if (type === "poseImage") {
          setAiReferenceAnalysis("");
          apiService.analyzeReferenceImage(file, "model", token).then((data) => {
            if (data?.success && data.analysis_text) setAiReferenceAnalysis(data.analysis_text);
          }).catch(() => {});
        }
      };

    const removeAiOrnamentImage = (e) => {
        e?.stopPropagation?.();
        setAiFormData((prev) => ({ ...prev, ornamentImage: null }));
        setAiOrnamentPreview(null);
        setAiUploadErrors((p) => ({ ...p, ornamentImage: null }));
        const input = document.getElementById("ai-ornament-input");
        if (input) input.value = "";
    };
    const removeAiPoseImage = (e) => {
        e?.stopPropagation?.();
        setAiFormData((prev) => ({ ...prev, poseImage: null }));
        setAiPosePreview(null);
        setAiReferenceAnalysis("");
        setAiUploadErrors((p) => ({ ...p, poseImage: null }));
        const input = document.getElementById("ai-pose-input");
        if (input) input.value = "";
    };

    const handleAiRegenerate = () => {
        setAiRegenerateModal({
            isOpen: true,
            prompt: '',
            loading: false,
            error: null,
            image: aiResult || null
        })
    }

    const submitAiRegenerate = async () => {
        if (!aiRegenerateModal.prompt.trim()) {
            setAiRegenerateModal(prev => ({
                ...prev,
                error: t("images.pleaseEnterPrompt")
            }))
            return
        }

        setAiRegenerateModal(prev => ({ ...prev, loading: true, error: null }))

        try {
            const target = aiRegenerateModal.image || aiResult
            if (!target?.mongo_id) {
                setAiRegenerateModal(prev => ({ ...prev, loading: false, error: 'Cannot regenerate: missing image ID.' }))
                return
            }
            const response = await apiService.regenerateImage(
                target.mongo_id,
                aiRegenerateModal.prompt,
                token
            )

            if (response.success) {
                const updated = { generated_image_url: response.generated_image_url, mongo_id: response.mongo_id, prompt: response.combined_prompt }
                if (aiResult?.images && Array.isArray(aiResult.images)) {
                    const idx = aiRegenerateModal.image?.index ?? 0
                    setAiResult({
                        ...aiResult,
                        images: aiResult.images.map((img, i) => (i === idx ? { ...img, ...updated } : img))
                    })
                } else {
                    setAiResult({ ...aiResult, ...updated })
                }
                setAiRegenerateModal({
                    isOpen: false,
                    prompt: '',
                    loading: false,
                    error: null,
                    image: null
                })
                toast.success(t("images.imageRegeneratedSuccess"))
            } else {
                throw new Error(response.error || 'Regeneration failed')
            }
        } catch (error) {
            console.error("Error regenerating image:", error)
            setAiRegenerateModal(prev => ({
                ...prev,
                loading: false,
                error: error.response?.data?.error || error.message || getUserFriendlyError(error) || t("images.failedToRegenerate")
            }))
        }
    }

    const closeAiRegenerateModal = () => {
        if (!aiRegenerateModal.loading) {
            setAiRegenerateModal({
                isOpen: false,
                prompt: '',
                loading: false,
                error: null,
                image: null
            })
        }
    }

    const handleAiSubmit = async (e) => {
        e.preventDefault()
        setAiError(null)
        setAiResult(null)

        if (!aiFormData.ornamentImage) {
            setAiError(t("images.pleaseUploadOrnamentImage"))
            return
        }

        if (numImages > 1 && !showCostNote) {
            setShowCostNote(true)
            return
        }
        setShowCostNote(false)

        setAiIsLoading(true)

        try {
            const formDataToSend = new FormData()
            formDataToSend.append("ornament_image", aiFormData.ornamentImage)
            if (aiFormData.poseImage) {
                formDataToSend.append("pose_style", aiFormData.poseImage)
            }
            if (aiReferenceAnalysis) formDataToSend.append("reference_analysis", aiReferenceAnalysis)
            formDataToSend.append("prompt", aiFormData.prompt || t("images.generateAIModelWearingOrnament"))
            formDataToSend.append("measurements", aiFormData.measurements || "")
            formDataToSend.append("ornament_type", aiOrnamentType || "")
            formDataToSend.append("ornament_measurements", JSON.stringify(aiOrnamentMeasurements))
            formDataToSend.append("dimension", aiFormData.dimension)
            formDataToSend.append("num_images", String(numImages))

            const response = await apiService.generateModelWithOrnament(formDataToSend, token)
            console.log("response for ai model generation:", response)
            if (response && (response.images?.length || response.generated_image_url || response.status === "success")) {
                setAiResult(response)
            } else {
                setAiError("We couldn’t generate the model. Please check your images and try again.");
            }
            
        } catch (err) {
            console.error("AI Generation Error:", err);
            setAiError(getUserFriendlyError(err));
        }
        finally {
            setAiIsLoading(false)
        }
    }

    // Real Model Handlers
    const handleRealFileChange = (type, file, inputEl) => {
        if (!file) return;
      
        setRealUploadErrors((p) => ({ ...p, [type]: null }));
      
        if (file.size > MAX_IMAGE_BYTES) {
          setRealUploadErrors((p) => ({
            ...p,
            [type]: "File size exceeded. Max 10MB allowed.",
          }));
          if (inputEl) inputEl.value = "";
          return;
        }
      
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          setRealUploadErrors((p) => ({
            ...p,
            [type]: "Only JPG, PNG or WEBP images allowed.",
          }));
          if (inputEl) inputEl.value = "";
          return;
        }
      
        setRealFormData((prev) => ({ ...prev, [type]: file }));
      
        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === "modelImage") setRealModelPreview(reader.result);
          else if (type === "ornamentImage") setRealOrnamentPreview(reader.result);
          else setRealPosePreview(reader.result);
        };
        reader.readAsDataURL(file);
        if (type === "poseImage") {
          setRealReferenceAnalysis("");
          apiService.analyzeReferenceImage(file, "model", token).then((data) => {
            if (data?.success && data.analysis_text) setRealReferenceAnalysis(data.analysis_text);
          }).catch(() => {});
        }
      };

    const removeRealModelImage = (e) => {
        e?.stopPropagation?.();
        setRealFormData((prev) => ({ ...prev, modelImage: null }));
        setRealModelPreview(null);
        setRealUploadErrors((p) => ({ ...p, modelImage: null }));
        const input = document.getElementById("real-model-input");
        if (input) input.value = "";
    };
    const removeRealOrnamentImage = (e) => {
        e?.stopPropagation?.();
        setRealFormData((prev) => ({ ...prev, ornamentImage: null }));
        setRealOrnamentPreview(null);
        setRealUploadErrors((p) => ({ ...p, ornamentImage: null }));
        const input = document.getElementById("real-ornament-input");
        if (input) input.value = "";
    };
    const removeRealPoseImage = (e) => {
        e?.stopPropagation?.();
        setRealFormData((prev) => ({ ...prev, poseImage: null }));
        setRealPosePreview(null);
        setRealReferenceAnalysis("");
        setRealUploadErrors((p) => ({ ...p, poseImage: null }));
        const input = document.getElementById("real-pose-input");
        if (input) input.value = "";
    };

    const handleRealRegenerate = () => {
        setRealRegenerateModal({
            isOpen: true,
            prompt: '',
            loading: false,
            error: null,
            image: realResult || null
        })
    }

    const submitRealRegenerate = async () => {
        if (!realRegenerateModal.prompt.trim()) {
            setRealRegenerateModal(prev => ({
                ...prev,
                error: t("images.pleaseEnterPrompt")
            }))
            return
        }

        setRealRegenerateModal(prev => ({ ...prev, loading: true, error: null }))

        try {
            const target = realRegenerateModal.image || realResult
            if (!target?.mongo_id) {
                setRealRegenerateModal(prev => ({ ...prev, loading: false, error: 'Cannot regenerate: missing image ID.' }))
                return
            }
            const response = await apiService.regenerateImage(
                target.mongo_id,
                realRegenerateModal.prompt,
                token
            )

            if (response.success) {
                const updated = { generated_image_url: response.generated_image_url, mongo_id: response.mongo_id, prompt: response.combined_prompt }
                if (realResult?.images && Array.isArray(realResult.images)) {
                    const idx = realRegenerateModal.image?.index ?? 0
                    setRealResult({
                        ...realResult,
                        images: realResult.images.map((img, i) => (i === idx ? { ...img, ...updated } : img))
                    })
                } else {
                    setRealResult({ ...realResult, ...updated })
                }
                setRealRegenerateModal({
                    isOpen: false,
                    prompt: '',
                    loading: false,
                    error: null,
                    image: null
                })
                toast.success(t("images.imageRegeneratedSuccess"))
            } else {
                throw new Error(response.error || 'Regeneration failed')
            }
        } catch (error) {
            console.error("Error regenerating image:", error)
            setRealRegenerateModal(prev => ({
                ...prev,
                loading: false,
                error: error.response?.data?.error || error.message || getUserFriendlyError(error) || t("images.failedToRegenerate")
            }))
        }
    }

    const closeRealRegenerateModal = () => {
        if (!realRegenerateModal.loading) {
            setRealRegenerateModal({
                isOpen: false,
                prompt: '',
                loading: false,
                error: null,
                image: null
            })
        }
    }

    const handleRealSubmit = async (e) => {
        e.preventDefault()
        setRealError(null)
        setRealResult(null)

        if (!realFormData.modelImage) {
            setRealError(t("images.pleaseUploadModelImage"))
            return
        }

        if (!realFormData.ornamentImage) {
            setRealError(t("images.pleaseUploadOrnamentImage"))
            return
        }

        if (numImages > 1 && !showCostNote) {
            setShowCostNote(true)
            return
        }
        setShowCostNote(false)

        setRealIsLoading(true)

        try {
            const formDataToSend = new FormData()
            formDataToSend.append("model_image", realFormData.modelImage)
            formDataToSend.append("ornament_image", realFormData.ornamentImage)
            if (realFormData.poseImage) {
                formDataToSend.append("pose_style", realFormData.poseImage)
            }
            if (realReferenceAnalysis) formDataToSend.append("reference_analysis", realReferenceAnalysis)
            formDataToSend.append("prompt", realFormData.prompt || t("images.generateRealisticImageWithModel"))
            formDataToSend.append("measurements", realFormData.measurements || "")
            formDataToSend.append("ornament_type", realOrnamentType || "")
            formDataToSend.append("ornament_measurements", JSON.stringify(realOrnamentMeasurements))
            formDataToSend.append("dimension", realFormData.dimension)
            formDataToSend.append("num_images", String(numImages))

            const response = await apiService.generateRealModelWithOrnament(formDataToSend, token)
            console.log("response for real model generation:", response)

            if (response && (response.images?.length || response.generated_image_url || response.status === "success")) {
                setRealResult(response)
            } else {
                setRealError(response?.message || t("images.failedToGenerate"))
            }
        } catch (err) {
            console.error("Real Model Generation Error:", err);
            setRealError(getUserFriendlyError(err));
        }
        finally {
            setRealIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Enhanced Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gold-solid rounded-2xl shadow-lg">
                            <HiOutlineUserCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-foreground">
                                {t("images.modelGeneration")}
                            </h1>
                            <p className="text-muted-foreground mt-2">{t("images.generateAIModelsOrUseReal")}</p>
                        </div>
                    </div>

                    {/* Sub-tabs */}
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => setActiveTab("ai_model")}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === "ai_model"
                                ? "bg-card text-gold-solid border border-gold-muted shadow-md"
                                : "bg-secondary/50 text-muted-foreground hover:bg-accent border border-border"
                                }`}
                        >
                            <Cpu className="w-5 h-5" />
                            {t("images.aiModel")}
                        </button>
                        <button
                            onClick={() => setActiveTab("real_model")}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === "real_model"
                                ? "bg-card text-gold-solid border border-gold-muted shadow-md"
                                : "bg-secondary/50 text-muted-foreground hover:bg-accent border border-border"
                                }`}
                        >
                            <Users className="w-5 h-5" />
                            {t("images.realModel")}
                        </button>
                    </div>
                </div>

                {/* Form and Result Container */}
                <div className={`grid grid-cols-1 gap-8 transition-all duration-500 ${currentState.result ? 'lg:grid-cols-[4fr_6fr]' : 'lg:grid-cols-[7fr_3fr]'}`}>
                    {/* Form */}
                    <div className="bg-card rounded-xl p-8 border border-border">
                        {activeTab === "ai_model" ? (
                            <form onSubmit={handleAiSubmit} className="space-y-6">
                                {/* Ornament Image */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2 flex-wrap">
                                        <div className="w-2 h-2 bg-gold-solid rounded-full"></div>
                                        {t("images.ornamentProductImage")}<span className="text-red-500 ml-1">*</span> <br />
                                        <span className="text-xs text-muted-foreground font-normal">upload the product image which is captured with the help of scale for better measurements.</span>
                                        <button type="button" onClick={(e) => { e.preventDefault(); setShowReferenceModal(true); }} className="text-xs text-blue-600 hover:underline font-medium">(View reference)</button>
                                        {aiUploadErrors.ornamentImage && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    {aiUploadErrors.ornamentImage}
  </p>
)}

                                    </label>
                                    <div
  className={`border-2 border-dashed rounded-xl p-6 cursor-pointer ${
    aiUploadErrors.ornamentImage
      ? "border-red-500 bg-red-500/10"
      : "border-border bg-secondary/30 hover:bg-accent"
  }`}
  onClick={() => document.getElementById("ai-ornament-input")?.click()}
>

                                        <input
                                            type="file"
                                            id="ai-ornament-input"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) =>
                                                handleAiFileChange("ornamentImage", e.target.files?.[0], e.target)
                                              }
                                              
                                        />
                                        {aiOrnamentPreview ? (
                                            <div className="relative w-full h-40">
                                                <Image src={aiOrnamentPreview} alt="Ornament Preview" fill className="object-contain rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={removeAiOrnamentImage}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500/100 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-gold-solid transition-colors" />
                                                <p className="text-sm text-muted-foreground">{t("images.pngJpgWebpUpTo15MB")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pose Style */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gold-solid rounded-full"></div>
                                        {t("images.poseStyleReference")} ({t("common.optional")})
                                        {aiUploadErrors.poseImage && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    {aiUploadErrors.poseImage}
  </p>
)}

                                    </label>
                                    <div
  className={`border-2 border-dashed rounded-xl p-6 cursor-pointer ${
    aiUploadErrors.poseImage
      ? "border-red-500 bg-red-500/10"
      : "border-border bg-secondary/30 hover:bg-accent"
  }`}
  onClick={() => document.getElementById("ai-pose-input")?.click()}
>

<input
  type="file"
  id="ai-pose-input"
  className="hidden"
  accept="image/*"
  onChange={(e) =>
    handleAiFileChange("poseImage", e.target.files?.[0], e.target)
  }
/>

                                        {aiPosePreview ? (
                                            <div className="relative w-full h-40">
                                                <Image src={aiPosePreview} alt="Pose Preview" fill className="object-contain rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={removeAiPoseImage}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500/100 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-gold-solid transition-colors" />
                                                <p className="text-sm text-muted-foreground">{t("images.uploadReferencePoseImage")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ornament Selection */}
                                <OrnamentSelection
                                    selectedType={aiOrnamentType}
                                    onTypeChange={setAiOrnamentType}
                                    measurements={aiOrnamentMeasurements}
                                    onMeasurementsChange={setAiOrnamentMeasurements}
                                />

                                {/* Custom Prompt */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-gold-solid" />
                                        {t("images.customInstructions")} ({t("common.optional")})
                                    </label>
                                    <textarea
                                        value={aiFormData.prompt}
                                        onChange={(e) => setAiFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                                        placeholder={t("images.addSpecificInstructionsForAIModel")}
                                        className="w-full px-4 py-3 border border-border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none shadow-sm"
                                        rows="3"
                                    />
                                </div>

                                {/* Number of images */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <MdPhotoSizeSelectLarge size={20} className="text-gold-solid" />
                                        {t("images.numberOfImages") || "Number of images"}
                                    </label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <NumberOfImagesSelector
                                            value={numImages}
                                            onChange={setNumImages}
                                            min={MIN_IMAGES}
                                            max={MAX_IMAGES}
                                            
                                        />
                                    </div>
                                </div>
                                {/* Dimensions */}
                                <DimensionsSelector
                                    selectedDimension={aiFormData.dimension}
                                    onDimensionChange={(dimension) => setAiFormData((prev) => ({ ...prev, dimension }))}
                                    
                                />

                                {/* Error Message */}
                                {aiError && (
                                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <p className="text-red-400 text-sm">
    {aiError}
</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex items-center justify-center gap-3 px-6 py-3 text-gold-solid font-semibold hover:bg-gold-solid/10 rounded-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    {t("common.back")}
                                </button>
                                <div ref={generateSectionRef} className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                                    {showCostNote && numImages > 1 && (
                                        <div className="flex items-start gap-2 px-4 py-3 w-full sm:max-w-md
bg-gray-100/80 
border border-border 
rounded-xl 
text-foreground text-sm leading-snug">

                                            <Coins className="w-5 h-5 text-amber-600 shrink-0" />
                                            <span>{t("images.creditsCost") || "Cost:"} {numImages * (creditSettings.credits_per_image_generation || 2)} {t("images.credits") || "credits"}. {t("images.clickGenerateAgainToConfirm") || "Click Generate again to confirm."}</span>
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={aiIsLoading}
                                        className="flex items-center justify-center gap-3 px-8 py-3.5 bg-gold-gradient text-primary-foreground rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                                    >
                                        {aiIsLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t("images.generating")}
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                    {t("images.generateAIModel")}
                                            </>
                                        )}
                                    </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleRealSubmit} className="space-y-6">
                                {/* Model Image */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gold-solid rounded-full"></div>
                                        Model Image<span className="text-red-500 ml-1">*</span>
                                        {realUploadErrors.modelImage && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    {realUploadErrors.modelImage}
  </p>
)}

                                    </label>
                                    <div
  className={`border-2 border-dashed rounded-xl p-6 cursor-pointer ${
    realUploadErrors.modelImage
      ? "border-red-500 bg-red-500/10"
      : "border-border bg-secondary/30 hover:bg-accent"
  }`}
  onClick={() => document.getElementById("real-model-input")?.click()}
>

                                        <input
  type="file"
  id="real-model-input"
  className="hidden"
  accept="image/*"
  onChange={(e) =>
    handleRealFileChange("modelImage", e.target.files?.[0], e.target)
  }
/>

                                        {realModelPreview ? (
                                            <div className="relative w-full h-40">
                                                <Image src={realModelPreview} alt="Model Preview" fill className="object-contain rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={removeRealModelImage}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500/100 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-gold-solid transition-colors" />
                                                <p className="text-sm text-muted-foreground">{t("images.uploadModelImage")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ornament Image */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2 flex-wrap">
                                        <div className="w-2 h-2 bg-gold-solid rounded-full"></div>
                                        {t("images.ornamentProductImage")}<span className="text-red-500 ml-1">*</span> <br />
                                        <span className="text-xs text-muted-foreground font-normal">upload the product image which is captured with the help of scale for better measurements.</span>
                                        <button type="button" onClick={(e) => { e.preventDefault(); setShowReferenceModal(true); }} className="text-xs text-blue-600 hover:underline font-medium">(View reference)</button>
                                        {realUploadErrors.ornamentImage && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    {realUploadErrors.ornamentImage}
  </p>
)}

                                    </label>
                                    <div
  className={`border-2 border-dashed rounded-xl p-6 cursor-pointer ${
    realUploadErrors.ornamentImage
      ? "border-red-500 bg-red-500/10"
      : "border-border bg-secondary/30 hover:bg-accent"
  }`}
  onClick={() => document.getElementById("real-ornament-input")?.click()}
>

<input
  type="file"
  id="real-ornament-input"
  className="hidden"
  accept="image/*"
  onChange={(e) =>
    handleRealFileChange("ornamentImage", e.target.files?.[0], e.target)
  }
/>

                                        {realOrnamentPreview ? (
                                            <div className="relative w-full h-40">
                                                <Image src={realOrnamentPreview} alt="Ornament Preview" fill className="object-contain rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={removeRealOrnamentImage}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500/100 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-gold-solid transition-colors" />
                                                <p className="text-sm text-muted-foreground">{t("images.uploadOrnamentProductImage")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pose Style */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gold-solid rounded-full"></div>
                                        {t("images.poseStyleReference")} ({t("common.optional")})
                                        {realUploadErrors.poseImage && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    {realUploadErrors.poseImage}
  </p>
)}

                                    </label>
                                    <div
  className={`border-2 border-dashed rounded-xl p-6 cursor-pointer ${
    realUploadErrors.poseImage
      ? "border-red-500 bg-red-500/10"
      : "border-border bg-secondary/30 hover:bg-accent"
  }`}
  onClick={() => document.getElementById("real-pose-input")?.click()}
>

<input
  type="file"
  id="real-pose-input"
  className="hidden"
  accept="image/*"
  onChange={(e) =>
    handleRealFileChange("poseImage", e.target.files?.[0], e.target)
  }
/>

                                        {realPosePreview ? (
                                            <div className="relative w-full h-40">
                                                <Image src={realPosePreview} alt="Pose Preview" fill className="object-contain rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={removeRealPoseImage}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500/100 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-gold-solid transition-colors" />
                                                <p className="text-sm text-muted-foreground">{t("images.uploadReferencePoseOptional")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ornament Selection */}
                                <OrnamentSelection
                                    selectedType={realOrnamentType}
                                    onTypeChange={setRealOrnamentType}
                                    measurements={realOrnamentMeasurements}
                                    onMeasurementsChange={setRealOrnamentMeasurements}
                                />

                                {/* Additional Measurements */}
                                {/* <div>
                                    <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <Ruler className="w-4 h-4 text-gold-solid" />
                                        Additional Measurements (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="E.g., Length: 5cm, Width: 3cm"
                                        value={realFormData.measurements}
                                        onChange={(e) => setRealFormData((prev) => ({ ...prev, measurements: e.target.value }))}
                                        className="w-full px-4 py-3.5 border border-border rounded-xl bg-input text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all shadow-sm"
                                    />
                                </div> */}

                                {/* Custom Prompt */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-gold-solid" />
                                        {t("images.customInstructions")} ({t("common.optional")})
                                    </label>
                                    <textarea
                                        value={realFormData.prompt}
                                        onChange={(e) => setRealFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                                        placeholder={t("images.addSpecificInstructionsForPlacingOrnament")}
                                        className="w-full px-4 py-3 border border-border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none shadow-sm"
                                        rows="3"
                                    />
                                </div>

                                {/* Number of images */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <MdPhotoSizeSelectLarge size={20} className="text-gold-solid" />
                                        {t("images.numberOfImages") || "Number of images"}
                                    </label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <NumberOfImagesSelector
                                            value={numImages}
                                            onChange={setNumImages}
                                            min={MIN_IMAGES}
                                            max={MAX_IMAGES}
                                            
                                        />
                                    </div>
                                </div>
                                {/* Dimensions */}
                                <DimensionsSelector
                                    selectedDimension={realFormData.dimension}
                                    onDimensionChange={(dimension) => setRealFormData((prev) => ({ ...prev, dimension }))}
                                    
                                />

                                {/* Error Message */}
                                {realError && (
                                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <p className="text-red-400 text-sm">
    {realError}
</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex items-center justify-center gap-3 px-6 py-3 text-gold-solid font-semibold hover:bg-gold-solid/10 rounded-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    {t("common.back")}
                                </button>
                                <div ref={generateSectionRef} className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                                    {showCostNote && numImages > 1 && (
                                        <div className="flex items-start gap-2 px-4 py-3 w-full sm:max-w-md
bg-gray-100/80 
border border-border 
rounded-xl 
text-foreground text-sm leading-snug">

                                            <Coins className="w-5 h-5 text-amber-600 shrink-0" />
                                            <span>{t("images.creditsCost") || "Cost:"} {numImages * (creditSettings.credits_per_image_generation || 2)} {t("images.credits") || "credits"}. {t("images.clickGenerateAgainToConfirm") || "Click Generate again to confirm."}</span>
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={realIsLoading}
                                        className="bg-gold-gradient text-primary-foreground px-8 py-3.5 rounded-xl flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                                    >
                                        {realIsLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t("images.generating")}
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                {t("images.generateImage")}
                                            </>
                                        )}
                                    </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Result Preview */}
                    <div className="bg-card rounded-xl p-8 border border-border">
                        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-gold-solid" />
                            {activeTab === "ai_model" ? t("images.generatedAIModel") : t("images.generatedImage")}
                        </h3>
                        {currentState.isLoading ? (
                            <div className="flex flex-col items-center justify-center h-[500px] text-center">
                                <Loader2 className="w-16 h-16 text-gold-solid animate-spin mb-4" />
                                <p className="text-muted-foreground text-lg">
                                    {activeTab === "ai_model" ? t("images.generatingAIModel") : t("images.generatingRealisticModel")}
                                </p>
                                <p className="text-muted-foreground text-sm mt-2">{t("images.mayTakeUpTo30Seconds")}</p>
                            </div>
                        ) : currentState.result ? (
                            <div className="space-y-6">
                                {currentState.result.images && currentState.result.images.length > 0 ? (
                                    <>
                                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                                            <p className="text-green-400 font-semibold">✓ {activeTab === "ai_model" ? t("images.aiModelGeneratedSuccess") : t("images.realModelImageGeneratedSuccess")} ({currentState.result.images.length} {t("images.images") || "images"})</p>
                                        </div>
                                        <div className="flex flex-col gap-6">
                                            {currentState.result.images.map((img, idx) => (
                                                <div key={img.mongo_id || idx} className="rounded-xl border-2 border-gold-muted/20 overflow-hidden bg-secondary/30">
                                                    <div className="relative w-full h-[400px]">
                                                        <Image
                                                            src={img.generated_image_url}
                                                            alt={`Generated ${idx + 1}`}
                                                            fill
                                                            sizes="100vw"
                                                            unoptimized
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                    <div className="p-4 flex flex-wrap gap-3 justify-center border-t border-gold-muted/10 items-center">
                                                        <span className="text-sm font-medium text-gold-solid bg-card px-2 py-1 rounded border border-gold-muted/20">Image {idx + 1}</span>
                                                        <button type="button" onClick={() => handleView(img)} className="px-4 py-3 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-secondary/30 flex items-center gap-2"><Eye size={16} />{t("images.view")}</button>
                                                        <button type="button" onClick={() => downloadImage(img.generated_image_url, `model-${idx + 1}.png`)} className="px-4 py-3 bg-gold-solid text-white rounded-xl font-semibold flex items-center gap-2"><Download size={16} />{t("images.download")}</button>
                                                        <button type="button" onClick={() => (activeTab === "ai_model" ? setAiRegenerateModal({ isOpen: true, prompt: '', loading: false, error: null, image: { ...img, index: idx } }) : setRealRegenerateModal({ isOpen: true, prompt: '', loading: false, error: null, image: { ...img, index: idx } }))} className="px-4 py-3 border-2 border-gold-muted text-gold-solid rounded-xl font-semibold hover:bg-gold-solid/10 flex items-center gap-2"><RefreshCw size={16} />{t("images.regenerate")}</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => { if (activeTab === "ai_model") { setAiResult(null); setAiFormData({ ornamentImage: null, poseImage: null, prompt: "", measurements: "", dimension: "1:1" }); setAiOrnamentType(""); setAiOrnamentMeasurements({}); setAiOrnamentPreview(null); setAiPosePreview(null); } else { setRealResult(null); setRealFormData({ modelImage: null, ornamentImage: null, poseImage: null, prompt: "", measurements: "", dimension: "1:1" }); setRealOrnamentType(""); setRealOrnamentMeasurements({}); setRealModelPreview(null); setRealOrnamentPreview(null); setRealPosePreview(null); } }} className="w-full px-4 py-3 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-secondary/30">{activeTab === "ai_model" ? t("images.newModel") : t("images.newImage")}</button>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border-2 border-gold-muted/20">
                                            <Image
                                                src={currentState.result.generated_image_url}
                                                alt={activeTab === "ai_model" ? "Generated AI Model" : "Generated Real Model"}
                                                fill
                                                sizes="100vw"
                                                unoptimized
                                                className="object-contain bg-secondary/30"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                                                <p className="text-green-400 font-semibold">✓ {activeTab === "ai_model" ? t("images.aiModelGeneratedSuccess") : t("images.realModelImageGeneratedSuccess")}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button onClick={() => handleView(currentState.result)} className="px-4 py-3 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-secondary/30 transition-all flex items-center justify-center gap-2"><Eye size={16} />{t("images.view")}</button>
                                                <button onClick={() => downloadImage(currentState.result.generated_image_url, "model-generated.png")} className="px-4 py-3 bg-gold-gradient text-white rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"><Download size={16} />{t("images.download")}</button>
                                                <button onClick={activeTab === "ai_model" ? handleAiRegenerate : handleRealRegenerate} className="px-4 py-3 border-2 border-gold-muted text-gold-solid hover:bg-gold-solid/10 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"><RefreshCw size={16} />{t("images.regenerate")}</button>
                                            </div>
                                            <button onClick={() => { if (activeTab === "ai_model") { setAiResult(null); setAiFormData({ ornamentImage: null, poseImage: null, prompt: "", measurements: "", dimension: "1:1" }); setAiOrnamentType(""); setAiOrnamentMeasurements({}); setAiOrnamentPreview(null); setAiPosePreview(null); } else { setRealResult(null); setRealFormData({ modelImage: null, ornamentImage: null, poseImage: null, prompt: "", measurements: "", dimension: "1:1" }); setRealOrnamentType(""); setRealOrnamentMeasurements({}); setRealModelPreview(null); setRealOrnamentPreview(null); setRealPosePreview(null); } }} className="w-full px-4 py-3 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-secondary/30">{activeTab === "ai_model" ? t("images.newModel") : t("images.newImage")}</button>
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                <p className="text-blue-700 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" />{activeTab === "ai_model" ? t("images.clickRegenerateToModifyAIModel") : t("images.clickRegenerateToModify")}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[500px] text-center">
                                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-gold-solid/10">
                                    {activeTab === "ai_model" ? (
                                        <Cpu className="w-12 h-12 text-gold-solid" />
                                    ) : (
                                        <Users className="w-12 h-12 text-gold-solid" />
                                    )}
                                </div>
                                <p className="text-muted-foreground text-lg">
                                    {activeTab === "ai_model" ? t("images.aiModelWillAppear") : t("images.generatedImageWillAppear")}
                                </p>
                                <p className="text-muted-foreground text-sm mt-2">
                                    {activeTab === "ai_model"
                                        ? t("images.uploadOrnamentAndClickGenerate")
                                        : t("images.uploadModelAndOrnamentToStart")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ReferenceImagesModal open={showReferenceModal} onOpenChange={setShowReferenceModal} />

            {/* Regenerate Modals */}
            {/* AI Model Regenerate Modal */}
            {aiRegenerateModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex-shrink-0 border-b border-border bg-card p-6 rounded-t-xl z-10 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gold-solid rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{t("images.regenerateAIModel")}</h2>
                                        <p className="text-sm text-muted-foreground">{t("images.modifyAndRegenerateAIModel")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeAiRegenerateModal}
                                    disabled={aiRegenerateModal.loading}
                                    className="p-2 hover:bg-accent rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <X className="w-6 h-6 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
                            <div>
                                <p className="text-sm font-semibold text-foreground mb-3">{t("images.currentImage")}:</p>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-border">
                                    <Image
                                        src={aiResult?.generated_image_url}
                                        alt="Current image"
                                        fill
                                        sizes="100vw"
                                        unoptimized
                                        className="object-contain bg-secondary/30"
                                    />
                                </div>
                            </div>
{/* 
                            {aiResult?.prompt && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-900 mb-2">{t("images.originalPrompt")}:</p>
                                    <p className="text-sm text-blue-700">{aiResult.prompt}</p>
                                </div>
                            )} */}

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-gold-solid" />
                                    {t("images.whatWouldYouLikeToChange")}
                                </label>
                                <textarea
                                    value={aiRegenerateModal.prompt}
                                    onChange={(e) => setAiRegenerateModal(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={t("images.regenerateAIModelPlaceholder")}
                                    className="w-full px-4 py-3 border border-border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                                    rows="4"
                                    disabled={aiRegenerateModal.loading}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    💡 {t("images.modificationWillBeAppliedToAIModel")}
                                </p>
                            </div>

                            {aiRegenerateModal.error && (
                                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-400 text-sm">{aiRegenerateModal.error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button
                                    onClick={closeAiRegenerateModal}
                                    disabled={aiRegenerateModal.loading}
                                    className="flex-1 px-6 py-3 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-secondary/30 transition-all disabled:opacity-50"
                                >
                                    {t("common.cancel")}
                                </button>
                                <button
                                    onClick={submitAiRegenerate}
                                    disabled={aiRegenerateModal.loading || !aiRegenerateModal.prompt.trim()}
                                    className="flex-1 px-6 py-3 bg-gold-solid text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {aiRegenerateModal.loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t("images.regenerating")}
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5" />
                                            {t("images.regenerateImage")}
                                        </>
                                    )}
                                </button>
                            </div>

                            {aiRegenerateModal.loading && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-yellow-800 text-sm text-center">
                                        ⏱️ {t("images.mayTakeUpTo30Seconds")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Real Model Regenerate Modal */}
            {realRegenerateModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex-shrink-0 border-b border-border bg-card p-6 rounded-t-xl z-10 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gold-solid rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{t("images.regenerateRealModelImage")}</h2>
                                        <p className="text-sm text-muted-foreground">{t("images.modifyAndRegenerateRealModel")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeRealRegenerateModal}
                                    disabled={realRegenerateModal.loading}
                                    className="p-2 hover:bg-accent rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <X className="w-6 h-6 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
                            <div>
                                <p className="text-sm font-semibold text-foreground mb-3">{t("images.currentImage")}:</p>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-border">
                                    <Image
                                        src={realResult?.generated_image_url}
                                        alt="Current image"
                                        fill
                                        sizes="100vw"
                                        unoptimized
                                        className="object-contain bg-secondary/30"
                                    />
                                </div>
                            </div>
{/* 
                            {realResult?.prompt && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-900 mb-2">{t("images.originalPrompt")}:</p>
                                    <p className="text-sm text-blue-700">{realResult.prompt}</p>
                                </div>
                            )} */}

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-gold-solid" />
                                    {t("images.whatWouldYouLikeToChange")}
                                </label>
                                <textarea
                                    value={realRegenerateModal.prompt}
                                    onChange={(e) => setRealRegenerateModal(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={t("images.regenerateRealModelPlaceholder")}
                                    className="w-full px-4 py-3 border border-border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                                    rows="4"
                                    disabled={realRegenerateModal.loading}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    💡 {t("images.modificationWillBeAppliedToRealModel")}
                                </p>
                            </div>

                            {realRegenerateModal.error && (
                                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-400 text-sm">{realRegenerateModal.error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button
                                    onClick={closeRealRegenerateModal}
                                    disabled={realRegenerateModal.loading}
                                    className="flex-1 px-6 py-3 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-secondary/30 transition-all disabled:opacity-50"
                                >
                                    {t("common.cancel")}
                                </button>
                                <button
                                    onClick={submitRealRegenerate}
                                    disabled={realRegenerateModal.loading || !realRegenerateModal.prompt.trim()}
                                    className="flex-1 px-6 py-3 bg-gold-solid text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {realRegenerateModal.loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t("images.regenerating")}
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5" />
                                            {t("images.regenerateImage")}
                                        </>
                                    )}
                                </button>
                            </div>

                            {realRegenerateModal.loading && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-yellow-800 text-sm text-center">
                                        ⏱️ {t("images.mayTakeUpTo30Seconds")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

