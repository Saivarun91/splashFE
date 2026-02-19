"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, Upload, Cpu, Users, Ruler, Zap, Loader2, CheckCircle, AlertCircle, RefreshCw, X, Download, Eye, Coins } from "lucide-react"
import { MdPhotoSizeSelectLarge } from "react-icons/md"
import { apiService } from "@/lib/api"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { OrnamentSelection } from "@/components/images/OrnamentSelection"
import { DimensionsSelector } from "@/components/images/DimensionsSelector"
import { ReferenceImagesModal } from "@/components/images/ReferenceImagesModal"
import toast from "react-hot-toast"
import { HiOutlineUserCircle } from "react-icons/hi";
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_IMAGES = 1;
const MAX_IMAGES = 10;

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

    useEffect(() => {
        let cancelled = false
        apiService.getImageCreditSettings(token).then((s) => {
            if (!cancelled && s) setCreditSettings(s)
        })
        return () => { cancelled = true }
    }, [token])
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

    const handleView = (url) => {
        window.open(url, '_blank');
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

        setAiIsLoading(true)

        try {
            const formDataToSend = new FormData()
            formDataToSend.append("ornament_image", aiFormData.ornamentImage)
            if (aiFormData.poseImage) {
                formDataToSend.append("pose_style", aiFormData.poseImage)
            }
            formDataToSend.append("prompt", aiFormData.prompt || t("images.generateAIModelWearingOrnament"))
            formDataToSend.append("measurements", aiFormData.measurements || "")
            formDataToSend.append("ornament_type", aiOrnamentType || "")
            formDataToSend.append("ornament_measurements", JSON.stringify(aiOrnamentMeasurements))
            formDataToSend.append("dimension", aiFormData.dimension)
            formDataToSend.append("num_images", String(numImages))

            const response = await apiService.generateModelWithOrnament(formDataToSend, token)

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

        setRealIsLoading(true)

        try {
            const formDataToSend = new FormData()
            formDataToSend.append("model_image", realFormData.modelImage)
            formDataToSend.append("ornament_image", realFormData.ornamentImage)
            if (realFormData.poseImage) {
                formDataToSend.append("pose_style", realFormData.poseImage)
            }
            formDataToSend.append("prompt", realFormData.prompt || t("images.generateRealisticImageWithModel"))
            formDataToSend.append("measurements", realFormData.measurements || "")
            formDataToSend.append("ornament_type", realOrnamentType || "")
            formDataToSend.append("ornament_measurements", JSON.stringify(realOrnamentMeasurements))
            formDataToSend.append("dimension", realFormData.dimension)
            formDataToSend.append("num_images", String(numImages))

            const response = await apiService.generateRealModelWithOrnament(formDataToSend, token)

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
        <div className="min-h-screen bg-gradient-to-br from-[#fcfcfc] via-[#f8f7ff] to-[#f5f3ff] p-8">
            <div className="max-w-6xl mx-auto">
                {/* Enhanced Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-[#7753ff] rounded-2xl shadow-lg">
                            <HiOutlineUserCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1a1a1a] to-[#884cff] bg-clip-text text-transparent">
                                {t("images.modelGeneration")}
                            </h1>
                            <p className="text-[#737373] mt-2">{t("images.generateAIModelsOrUseReal")}</p>
                        </div>
                    </div>

                    {/* Sub-tabs */}
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => setActiveTab("ai_model")}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === "ai_model"
                                ? "bg-white/90 backdrop-blur-md text-[#7753ff] shadow-[0_8px_32px_0_rgba(119,83,255,0.3)] border border-white/20"
                                : "bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 border border-gray-200/50 shadow-sm"
                                }`}
                        >
                            <Cpu className="w-5 h-5" />
                            {t("images.aiModel")}
                        </button>
                        <button
                            onClick={() => setActiveTab("real_model")}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === "real_model"
                                ? "bg-white/90 backdrop-blur-md text-[#7753ff] shadow-[0_8px_32px_0_rgba(119,83,255,0.3)] border border-white/20"
                                : "bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 border border-gray-200/50 shadow-sm"
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
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                        {activeTab === "ai_model" ? (
                            <form onSubmit={handleAiSubmit} className="space-y-6">
                                {/* Ornament Image */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 flex-wrap">
                                        <div className="w-2 h-2 bg-[#7753ff] rounded-full"></div>
                                        {t("images.ornamentProductImage")}<span className="text-red-500 ml-1">*</span> <br />
                                        <span className="text-xs text-gray-500 font-normal">upload the product image which is captured with the help of scale for better measurements.</span>
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
      ? "border-red-500 bg-red-50"
      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
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
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#7753ff] transition-colors" />
                                                <p className="text-sm text-gray-500">{t("images.pngJpgWebpUpTo15MB")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pose Style */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-[#7753ff] rounded-full"></div>
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
      ? "border-red-500 bg-red-50"
      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
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
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#7753ff] transition-colors" />
                                                <p className="text-sm text-gray-500">{t("images.uploadReferencePoseImage")}</p>
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#7753ff]" />
                                        {t("images.customInstructions")} ({t("common.optional")})
                                    </label>
                                    <textarea
                                        value={aiFormData.prompt}
                                        onChange={(e) => setAiFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                                        placeholder={t("images.addSpecificInstructionsForAIModel")}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7753ff] focus:border-transparent resize-none shadow-sm"
                                        rows="3"
                                    />
                                </div>

                                {/* Number of images */}
                                <div>
                                    <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                        <MdPhotoSizeSelectLarge size={20} className="text-[#7753ff]" />
                                        {t("images.numberOfImages") || "Number of images"}
                                    </label>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <input type="number" min={MIN_IMAGES} max={MAX_IMAGES} value={numImages} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setNumImages(Math.max(MIN_IMAGES, Math.min(MAX_IMAGES, v))); }} className="w-24 px-4 py-3 border border-[#e6e6e6] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7753ff]" />
                                        <span className="text-[#737373] text-sm">{MIN_IMAGES}–{MAX_IMAGES} {t("images.images") || "images"}</span>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                                            <Coins className="w-5 h-5 text-amber-600" />
                                            <span className="text-amber-800 font-semibold">{t("images.creditsCost") || "Cost:"} {numImages * (creditSettings.credits_per_image_generation || 2)} {t("images.credits") || "credits"}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Dimensions */}
                                <DimensionsSelector
                                    selectedDimension={aiFormData.dimension}
                                    onDimensionChange={(dimension) => setAiFormData((prev) => ({ ...prev, dimension }))}
                                    primaryColor="#7753ff"
                                />

                                {/* Error Message */}
                                {aiError && (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <p className="text-red-700 text-sm">
    {aiError}
</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="flex items-center gap-2 text-[#7753ff] font-semibold hover:text-[#6a47e6] transition-colors group"
                                    >
                                        <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                                        {t("common.back")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={aiIsLoading}
                                        className="bg-[#7753ff] hover:bg-[#6a47e6] text-white px-8 py-3 rounded-xl flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {aiIsLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t("images.generating")}
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                {t("images.generateAIModel")}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleRealSubmit} className="space-y-6">
                                {/* Model Image */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-[#7753ff] rounded-full"></div>
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
      ? "border-red-500 bg-red-50"
      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
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
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#7753ff] transition-colors" />
                                                <p className="text-sm text-gray-500">{t("images.uploadModelImage")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ornament Image */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 flex-wrap">
                                        <div className="w-2 h-2 bg-[#7753ff] rounded-full"></div>
                                        {t("images.ornamentProductImage")}<span className="text-red-500 ml-1">*</span> <br />
                                        <span className="text-xs text-gray-500 font-normal">upload the product image which is captured with the help of scale for better measurements.</span>
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
      ? "border-red-500 bg-red-50"
      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
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
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#7753ff] transition-colors" />
                                                <p className="text-sm text-gray-500">{t("images.uploadOrnamentProductImage")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pose Style */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-[#7753ff] rounded-full"></div>
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
      ? "border-red-500 bg-red-50"
      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
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
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#7753ff] transition-colors" />
                                                <p className="text-sm text-gray-500">{t("images.uploadReferencePoseOptional")}</p>
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <Ruler className="w-4 h-4 text-[#7753ff]" />
                                        Additional Measurements (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="E.g., Length: 5cm, Width: 3cm"
                                        value={realFormData.measurements}
                                        onChange={(e) => setRealFormData((prev) => ({ ...prev, measurements: e.target.value }))}
                                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm"
                                    />
                                </div> */}

                                {/* Custom Prompt */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#7753ff]" />
                                        {t("images.customInstructions")} ({t("common.optional")})
                                    </label>
                                    <textarea
                                        value={realFormData.prompt}
                                        onChange={(e) => setRealFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                                        placeholder={t("images.addSpecificInstructionsForPlacingOrnament")}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7753ff] focus:border-transparent resize-none shadow-sm"
                                        rows="3"
                                    />
                                </div>

                                {/* Number of images */}
                                <div>
                                    <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                        <MdPhotoSizeSelectLarge size={20} className="text-[#7753ff]" />
                                        {t("images.numberOfImages") || "Number of images"}
                                    </label>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <input type="number" min={MIN_IMAGES} max={MAX_IMAGES} value={numImages} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setNumImages(Math.max(MIN_IMAGES, Math.min(MAX_IMAGES, v))); }} className="w-24 px-4 py-3 border border-[#e6e6e6] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7753ff]" />
                                        <span className="text-[#737373] text-sm">{MIN_IMAGES}–{MAX_IMAGES} {t("images.images") || "images"}</span>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                                            <Coins className="w-5 h-5 text-amber-600" />
                                            <span className="text-amber-800 font-semibold">{t("images.creditsCost") || "Cost:"} {numImages * (creditSettings.credits_per_image_generation || 2)} {t("images.credits") || "credits"}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Dimensions */}
                                <DimensionsSelector
                                    selectedDimension={realFormData.dimension}
                                    onDimensionChange={(dimension) => setRealFormData((prev) => ({ ...prev, dimension }))}
                                    primaryColor="#7753ff"
                                />

                                {/* Error Message */}
                                {realError && (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <p className="text-red-700 text-sm">
    {realError}
</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="flex items-center gap-2 text-[#7753ff] font-semibold hover:text-[#6a47e6] transition-colors group"
                                    >
                                        <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={realIsLoading}
                                        className="bg-[#7753ff] hover:bg-[#6a47e6] text-white px-8 py-3 rounded-xl flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {realIsLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                {t("images.generateImage")}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Result Preview */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                        <h3 className="text-2xl font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-[#7753ff]" />
                            {activeTab === "ai_model" ? t("images.generatedAIModel") : t("images.generatedImage")}
                        </h3>
                        {currentState.isLoading ? (
                            <div className="flex flex-col items-center justify-center h-[500px] text-center">
                                <Loader2 className="w-16 h-16 text-[#7753ff] animate-spin mb-4" />
                                <p className="text-[#737373] text-lg">
                                    {activeTab === "ai_model" ? t("images.generatingAIModel") : t("images.generatingRealisticModel")}
                                </p>
                                <p className="text-[#737373] text-sm mt-2">{t("images.mayTakeUpTo30Seconds")}</p>
                            </div>
                        ) : currentState.result ? (
                            <div className="space-y-6">
                                {currentState.result.images && currentState.result.images.length > 0 ? (
                                    <>
                                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                            <p className="text-green-700 font-semibold">✓ {activeTab === "ai_model" ? t("images.aiModelGeneratedSuccess") : t("images.realModelImageGeneratedSuccess")} ({currentState.result.images.length} {t("images.images") || "images"})</p>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {currentState.result.images.map((img, idx) => (
                                                <div key={img.mongo_id || idx} className="rounded-xl border-2 border-[#7753ff]/20 overflow-hidden bg-gray-50">
                                                    <div className="relative aspect-square">
                                                        <Image src={img.generated_image_url} alt={`Generated ${idx + 1}`} fill className="object-contain" />
                                                    </div>
                                                    <div className="p-2 flex flex-wrap gap-1 justify-center">
                                                        <button type="button" onClick={() => handleView(img.generated_image_url)} className="p-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50"><Eye size={14} /></button>
                                                        <button type="button" onClick={() => downloadImage(img.generated_image_url, `model-${idx + 1}.png`)} className="p-2 bg-[#7753ff] text-white rounded-lg text-xs font-medium"><Download size={14} /></button>
                                                        <button type="button" onClick={() => (activeTab === "ai_model" ? setAiRegenerateModal({ isOpen: true, prompt: '', loading: false, error: null, image: { ...img, index: idx } }) : setRealRegenerateModal({ isOpen: true, prompt: '', loading: false, error: null, image: { ...img, index: idx } }))} className="p-2 border border-[#7753ff] text-[#7753ff] rounded-lg text-xs font-medium hover:bg-[#7753ff]/10"><RefreshCw size={14} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => { if (activeTab === "ai_model") { setAiResult(null); setAiFormData({ ornamentImage: null, poseImage: null, prompt: "", measurements: "", dimension: "1:1" }); setAiOrnamentType(""); setAiOrnamentMeasurements({}); setAiOrnamentPreview(null); setAiPosePreview(null); } else { setRealResult(null); setRealFormData({ modelImage: null, ornamentImage: null, poseImage: null, prompt: "", measurements: "", dimension: "1:1" }); setRealOrnamentType(""); setRealOrnamentMeasurements({}); setRealModelPreview(null); setRealOrnamentPreview(null); setRealPosePreview(null); } }} className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50">{activeTab === "ai_model" ? t("images.newModel") : t("images.newImage")}</button>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border-2 border-[#7753ff]/20">
                                            <Image src={currentState.result.generated_image_url} alt={activeTab === "ai_model" ? "Generated AI Model" : "Generated Real Model"} fill className="object-contain bg-gray-50" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                                <p className="text-green-700 font-semibold">✓ {activeTab === "ai_model" ? t("images.aiModelGeneratedSuccess") : t("images.realModelImageGeneratedSuccess")}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button onClick={() => handleView(currentState.result.generated_image_url)} className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"><Eye size={16} />{t("images.view")}</button>
                                                <button onClick={() => downloadImage(currentState.result.generated_image_url, "model-generated.png")} className="px-4 py-3 bg-gradient-to-r from-[#884cff] to-[#5a2fcf] text-white rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"><Download size={16} />{t("images.download")}</button>
                                                <button onClick={activeTab === "ai_model" ? handleAiRegenerate : handleRealRegenerate} className="px-4 py-3 border-2 border-[#7753ff] text-[#7753ff] hover:bg-[#7753ff]/10 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"><RefreshCw size={16} />{t("images.regenerate")}</button>
                                            </div>
                                            <button onClick={() => { if (activeTab === "ai_model") { setAiResult(null); setAiFormData({ ornamentImage: null, poseImage: null, prompt: "", measurements: "", dimension: "1:1" }); setAiOrnamentType(""); setAiOrnamentMeasurements({}); setAiOrnamentPreview(null); setAiPosePreview(null); } else { setRealResult(null); setRealFormData({ modelImage: null, ornamentImage: null, poseImage: null, prompt: "", measurements: "", dimension: "1:1" }); setRealOrnamentType(""); setRealOrnamentMeasurements({}); setRealModelPreview(null); setRealOrnamentPreview(null); setRealPosePreview(null); } }} className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50">{activeTab === "ai_model" ? t("images.newModel") : t("images.newImage")}</button>
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                <p className="text-blue-700 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" />{activeTab === "ai_model" ? t("images.clickRegenerateToModifyAIModel") : t("images.clickRegenerateToModify")}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[500px] text-center">
                                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-[#7753ff]/10">
                                    {activeTab === "ai_model" ? (
                                        <Cpu className="w-12 h-12 text-[#7753ff]" />
                                    ) : (
                                        <Users className="w-12 h-12 text-[#7753ff]" />
                                    )}
                                </div>
                                <p className="text-[#737373] text-lg">
                                    {activeTab === "ai_model" ? t("images.aiModelWillAppear") : t("images.generatedImageWillAppear")}
                                </p>
                                <p className="text-[#737373] text-sm mt-2">
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
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#7753ff] rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#1a1a1a]">{t("images.regenerateAIModel")}</h2>
                                        <p className="text-sm text-gray-500">{t("images.modifyAndRegenerateAIModel")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeAiRegenerateModal}
                                    disabled={aiRegenerateModal.loading}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-3">{t("images.currentImage")}:</p>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                                    <Image
                                        src={aiResult?.generated_image_url}
                                        alt="Current image"
                                        fill
                                        className="object-contain bg-gray-50"
                                    />
                                </div>
                            </div>

                            {aiResult?.prompt && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-900 mb-2">{t("images.originalPrompt")}:</p>
                                    <p className="text-sm text-blue-700">{aiResult.prompt}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#7753ff]" />
                                    {t("images.whatWouldYouLikeToChange")}
                                </label>
                                <textarea
                                    value={aiRegenerateModal.prompt}
                                    onChange={(e) => setAiRegenerateModal(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={t("images.regenerateAIModelPlaceholder")}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7753ff] focus:border-transparent resize-none"
                                    rows="4"
                                    disabled={aiRegenerateModal.loading}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 {t("images.modificationWillBeAppliedToAIModel")}
                                </p>
                            </div>

                            {aiRegenerateModal.error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            {aiRegenerateModal.error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 text-sm">
            {aiRegenerateModal.error}
        </p>
                                </div>
                            )}


                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={closeAiRegenerateModal}
                                    disabled={aiRegenerateModal.loading}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    {t("common.cancel")}
                                </button>
                                <button
                                    onClick={submitAiRegenerate}
                                    disabled={aiRegenerateModal.loading || !aiRegenerateModal.prompt.trim()}
                                    className="flex-1 px-6 py-3 bg-[#7753ff] text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#7753ff] rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#1a1a1a]">{t("images.regenerateRealModelImage")}</h2>
                                        <p className="text-sm text-gray-500">{t("images.modifyAndRegenerateRealModel")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeRealRegenerateModal}
                                    disabled={realRegenerateModal.loading}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-3">{t("images.currentImage")}:</p>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                                    <Image
                                        src={realResult?.generated_image_url}
                                        alt="Current image"
                                        fill
                                        className="object-contain bg-gray-50"
                                    />
                                </div>
                            </div>

                            {realResult?.prompt && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-900 mb-2">{t("images.originalPrompt")}:</p>
                                    <p className="text-sm text-blue-700">{realResult.prompt}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#7753ff]" />
                                    {t("images.whatWouldYouLikeToChange")}
                                </label>
                                <textarea
                                    value={realRegenerateModal.prompt}
                                    onChange={(e) => setRealRegenerateModal(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={t("images.regenerateRealModelPlaceholder")}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7753ff] focus:border-transparent resize-none"
                                    rows="4"
                                    disabled={realRegenerateModal.loading}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 {t("images.modificationWillBeAppliedToRealModel")}
                                </p>
                            </div>

                            {realRegenerateModal.error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 text-sm">{realRegenerateModal.error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={closeRealRegenerateModal}
                                    disabled={realRegenerateModal.loading}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    {t("common.cancel")}
                                </button>
                                <button
                                    onClick={submitRealRegenerate}
                                    disabled={realRegenerateModal.loading || !realRegenerateModal.prompt.trim()}
                                    className="flex-1 px-6 py-3 bg-[#7753ff] text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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

