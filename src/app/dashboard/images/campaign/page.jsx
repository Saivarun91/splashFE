"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, Upload, Award, Zap, Loader2, CheckCircle, AlertCircle, X, Download, RefreshCw, Cpu, Users, Eye, Coins } from "lucide-react"
import { MdPhotoSizeSelectLarge } from "react-icons/md"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { DimensionsSelector } from "@/components/images/DimensionsSelector"
import { ORNAMENT_TYPES } from "@/components/images/OrnamentSelection"
import { OrnamentTypeSelect } from "@/components/images/OrnamentTypeSelect"
import { ReferenceImagesModal } from "@/components/images/ReferenceImagesModal"
import toast from "react-hot-toast"
import { openImageViewer } from "@/lib/openImageViewer"
import { SiGooglecampaignmanager360  } from "react-icons/si";
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_IMAGES = 1;
const MAX_IMAGES = 3;

export default function CampaignForm() {
    const router = useRouter()
    const { token } = useAuth()
    const { t } = useLanguage()
    const [uploadErrors, setUploadErrors] = useState({
        modelImage: null,
        ornamentImages: null,
        themeImages: null,
      });
      
    const [formData, setFormData] = useState({
        modelType: "ai_model",
        modelImage: null,
        ornamentImages: [],
        ornamentNames: [],
        ornamentTypes: [],
        // Per-ornament measurements (optional for each ornament)
        ornamentMeasurements: [],
        themeImages: [],
        prompt: "",
        dimension: "1:1",
    })
    const [modelPreview, setModelPreview] = useState(null)
    const [ornamentPreviews, setOrnamentPreviews] = useState([])
    const [themePreviews, setThemePreviews] = useState([])
    const [themeReferenceAnalyses, setThemeReferenceAnalyses] = useState([]) // kept for backward-compat; backend now analyzes theme images
    const [modelReferenceAnalysis, setModelReferenceAnalysis] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showReferenceModal, setShowReferenceModal] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [openMeasurements, setOpenMeasurements] = useState({});
    const [regenerateModal, setRegenerateModal] = useState({
        isOpen: false,
        prompt: '',
        loading: false,
        error: null,
        image: null
    })
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

    const handleView = (selectedImage = null) => {
        const generatedImages =
            result?.images && result.images.length > 0
                ? result.images
                : result?.generated_image_url
                  ? [result]
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
    const toggleMeasurements = (index) => {
        setOpenMeasurements(prev => ({
          ...prev,
          [index]: !prev[index]
        }));
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

    const handleModelImageChange = (file, inputEl) => {
        if (!file) return;
      
        setUploadErrors((p) => ({ ...p, modelImage: null }));
        setModelReferenceAnalysis("");
      
        if (file.size > MAX_IMAGE_BYTES) {
          setUploadErrors((p) => ({
            ...p,
            modelImage: "File size exceeded. Max 10MB allowed.",
          }));
          if (inputEl) inputEl.value = "";
          return;
        }
      
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          setUploadErrors((p) => ({
            ...p,
            modelImage: "Only JPG, PNG or WEBP images allowed.",
          }));
          if (inputEl) inputEl.value = "";
          return;
        }
      
        setFormData((prev) => ({ ...prev, modelImage: file }));
      
        const reader = new FileReader();
        reader.onloadend = () => setModelPreview(reader.result);
        reader.readAsDataURL(file);

        // Analyze model reference for real-model campaign: pose, attire, styling
        apiService
            .analyzeReferenceImage(file, "model", token)
            .then((data) => setModelReferenceAnalysis(data?.analysis_text || ""))
            .catch(() => setModelReferenceAnalysis(""));
      };
      

      const handleOrnamentImagesChange = (files, inputEl) => {
        const fileArray = Array.from(files);
      
        setUploadErrors((p) => ({ ...p, ornamentImages: null }));
      
        for (const file of fileArray) {
          if (file.size > MAX_IMAGE_BYTES) {
            setUploadErrors((p) => ({
              ...p,
              ornamentImages: "Ornament Image uploaded exceeds 10MB",
            }));
            if (inputEl) inputEl.value = "";
            return;
          }
      
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setUploadErrors((p) => ({
              ...p,
              ornamentImages: "Only JPG, PNG or WEBP images allowed.",
            }));
            if (inputEl) inputEl.value = "";
            return;
          }
        }
      
        setFormData((prev) => ({
          ...prev,
          ornamentImages: [...prev.ornamentImages, ...fileArray],
          ornamentNames: [...prev.ornamentNames, ...fileArray.map((f) => f.name)],
          ornamentTypes: [
            ...(prev.ornamentTypes || []),
            ...fileArray.map(() => ""),
          ],
          ornamentMeasurements: [
            ...(prev.ornamentMeasurements || []),
            // Initialise empty measurements object for each new ornament
            ...fileArray.map(() => ({})),
          ],
        }));
      
        fileArray.forEach((file) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            setOrnamentPreviews((prev) => [...prev, reader.result]);
          reader.readAsDataURL(file);
        });
      };
      

      const handleThemeImagesChange = (files, inputEl) => {
        const fileArray = Array.from(files);
      
        setUploadErrors((p) => ({ ...p, themeImages: null }));
      
        for (const file of fileArray) {
          if (file.size > MAX_IMAGE_BYTES) {
            setUploadErrors((p) => ({
              ...p,
              themeImages: "Theme image uploaded is more then 10MB",
            }));
            if (inputEl) inputEl.value = "";
            return;
          }
      
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setUploadErrors((p) => ({
              ...p,
              themeImages: "Only JPG, PNG or WEBP images allowed.",
            }));
            if (inputEl) inputEl.value = "";
            return;
          }
        }
      
        setFormData((prev) => ({
          ...prev,
          themeImages: [...prev.themeImages, ...fileArray],
        }));
      
        fileArray.forEach((file) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            setThemePreviews((prev) => [...prev, reader.result]);
          reader.readAsDataURL(file);
        });
        // Theme/Style images are analyzed on the backend (Celery) to keep logic centralized.
      };
      

    const removeOrnament = (index) => {
        setFormData((prev) => ({
            ...prev,
            ornamentImages: prev.ornamentImages.filter((_, i) => i !== index),
            ornamentNames: prev.ornamentNames.filter((_, i) => i !== index),
            ornamentTypes: (prev.ornamentTypes || []).filter((_, i) => i !== index),
            ornamentMeasurements: (prev.ornamentMeasurements || []).filter((_, i) => i !== index),
        }))
        setOrnamentPreviews((prev) => prev.filter((_, i) => i !== index))
    }

    const handleOrnamentTypeChange = (index, typeId) => {
        setFormData((prev) => {
            const updatedTypes = [...(prev.ornamentTypes || [])]
            updatedTypes[index] = typeId
            return {
                ...prev,
                ornamentTypes: updatedTypes,
            }
        })
    }

    const handleOrnamentMeasurementChange = (index, measurementId, value) => {
        setFormData((prev) => {
            const allMeasurements = [...(prev.ornamentMeasurements || [])]
            const current = allMeasurements[index] || {}
            allMeasurements[index] = {
                ...current,
                [measurementId]: value,
            }
            return {
                ...prev,
                ornamentMeasurements: allMeasurements,
            }
        })
    }

    const removeTheme = (index) => {
        setFormData((prev) => ({
            ...prev,
            themeImages: prev.themeImages.filter((_, i) => i !== index),
        }))
        setThemePreviews((prev) => prev.filter((_, i) => i !== index))
        setThemeReferenceAnalyses((prev) => prev.filter((_, i) => i !== index))
    }

    const handleRegenerate = (imageItem) => {
        // console.log("HANDLE REGENERATE RECEIVED:", imageItem)
    
        setRegenerateModal({
            isOpen: true,
            prompt: '',
            loading: false,
            error: null,
            image: imageItem
        })
    }

const submitRegenerate = async () => {
    // console.log("regenerateModal.image", regenerateModal.image)
    if (!regenerateModal.prompt.trim()) {
        setRegenerateModal(prev => ({
            ...prev,
            error: 'Please enter a prompt for regeneration'
        }))
        return
    }

    setRegenerateModal(prev => ({ ...prev, loading: true, error: null }))

    try {
        const target = regenerateModal.image

        if (!target || !target.mongo_id) {
            setRegenerateModal(prev => ({
                ...prev,
                loading: false,
                error: 'Cannot regenerate: image ID missing.'
            }))
            return
        }

        const response = await apiService.regenerateImage(
            target.mongo_id,
            regenerateModal.prompt,
            token
        )

            if (response.success) {
                const updated = { generated_image_url: response.generated_image_url, mongo_id: response.mongo_id, prompt: response.combined_prompt }
                if (result?.images && Array.isArray(result.images)) {
                    const idx = regenerateModal.image?.index ?? 0
                    setResult({
                        ...result,
                        images: result.images.map((img, i) => (i === idx ? { ...img, ...updated } : img))
                    })
                } else {
                    setResult({ ...result, ...updated })
                }
                setRegenerateModal({ isOpen: false, prompt: '', loading: false, error: null, image: null })
                toast.success(t("images.imageRegeneratedSuccess"))
            } else {
                throw new Error(response.error || 'Regeneration failed')
            }
        } catch (error) {
            console.error("Error regenerating image:", error)
            setRegenerateModal(prev => ({
                ...prev,
                loading: false,
                error: error.response?.data?.error || error.message || t("images.failedToRegenerate")
            }))
        }
    }

    const closeRegenerateModal = () => {
        if (!regenerateModal.loading) {
            setRegenerateModal({
                isOpen: false,
                prompt: '',
                loading: false,
                error: null,
                image: null
            })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setResult(null)

        if (formData.ornamentImages.length === 0) {
            setError(t("images.pleaseUploadAtLeastOneOrnament"))
            return
        }

        if (
            !formData.ornamentTypes ||
            formData.ornamentTypes.length !== formData.ornamentImages.length ||
            formData.ornamentTypes.some((type) => !type)
        ) {
            setError("Please select ornament type for each ornament image.")
            return
        }

        if (formData.modelType === "real_model" && !formData.modelImage) {
            setError(t("images.pleaseUploadModelImageForRealModel"))
            return
        }

        if (numImages > 1 && !showCostNote) {
            setShowCostNote(true)
            return
        }
        setShowCostNote(false)

        setIsLoading(true)

        try {
            const formDataToSend = new FormData()
            formDataToSend.append("model_type", formData.modelType)
            if (formData.modelImage) {
                formDataToSend.append("model_image", formData.modelImage)
            }
            formData.ornamentImages.forEach((image) => {
                formDataToSend.append("ornament_images", image)
            })
            formData.ornamentNames.forEach((name) => {
                formDataToSend.append("ornament_names", name)
            })
            ;(formData.ornamentTypes || []).forEach((typeId) => {
                formDataToSend.append("ornament_types", typeId || "")
            })
            // Optional per-ornament measurements (can be an empty array)
            formDataToSend.append(
                "ornament_measurements",
                JSON.stringify(formData.ornamentMeasurements || [])
            )
            // Send theme images; backend will analyze them and use analysis text for generation.
            formData.themeImages.forEach((image) => {
                formDataToSend.append("theme_images", image)
            })
            if (formData.modelType === "real_model" && modelReferenceAnalysis) {
                formDataToSend.append("reference_analysis", modelReferenceAnalysis)
            }
            formDataToSend.append("prompt", formData.prompt || t("images.createProfessionalCampaignShot"))
            formDataToSend.append("dimension", formData.dimension)
            formDataToSend.append("num_images", String(numImages))

            const response = await apiService.generateCampaignShot(formDataToSend, token)

            if (response && (response.images?.length || response.generated_image_url || response.status === "success")) {
                setResult(response)
            } else {
                setError(response?.message || t("images.failedToGenerateCampaignShot"))
            }
        } catch (err) {
            const backendMessage =
                err.response?.data?.error ||
                err.response?.data?.message ||
                err.message ||
                "Something went wrong";
        
            setError(backendMessage);
        }
        finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fcfcfc] via-[#f8f7ff] to-[#f5f3ff] p-8">
            <div className="max-w-7xl mx-auto">
                {/* Enhanced Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-[#7753ff] rounded-2xl shadow-lg">
                            <SiGooglecampaignmanager360  className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1a1a1a] to-[#884cff] bg-clip-text text-transparent">
                                {t("images.campaignShots")}
                            </h1>
                            <p className="text-[#737373] mt-2">{t("images.marketingReady")}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => setFormData((prev) => ({ ...prev, modelType: "ai_model" }))}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${formData.modelType === "ai_model"
                                ? "bg-white/90 backdrop-blur-md text-[#7753ff] shadow-[0_8px_32px_0_rgba(119,83,255,0.3)] border border-white/20"
                                : "bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 border border-gray-200/50 shadow-sm"
                                }`}
                        >
                            <Cpu className="w-5 h-5" />
                            {t("images.aiModel")}
                        </button>
                        <button
                            onClick={() => setFormData((prev) => ({ ...prev, modelType: "real_model" }))}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${formData.modelType === "real_model"
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
                <div className={`grid grid-cols-1 gap-8 transition-all duration-500 ${result ? 'lg:grid-cols-[4fr_6fr]' : 'lg:grid-cols-[7fr_3fr]'}`}>
                    {/* Form */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Model Image (if real_model) */}
                            {formData.modelType === "real_model" && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-[#7753ff] rounded-full"></div>
                                        {t("images.modelImage")}<span className="text-red-500 ml-1">*</span>
                                        {uploadErrors.modelImage && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    {uploadErrors.modelImage}
  </p>
)}

                                    </label>
                                    <div
  className={`border-2 border-dashed rounded-xl p-6 cursor-pointer ${
    uploadErrors.modelImage
      ? "border-red-500 bg-red-50"
      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
  }`}
  onClick={() => document.getElementById("model-image")?.click()}
>

                                        <input
                                            type="file"
                                            id="model-image"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) =>
                                                handleModelImageChange(e.target.files?.[0], e.target)
                                              }
                                              
                                        />
                                        {modelPreview ? (
                                            <div className="relative w-full h-32">
                                                <Image src={modelPreview} alt="Model Preview" fill className="object-contain rounded-lg" />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#7753ff] transition-colors" />
                                                <p className="text-sm text-gray-500">{t("images.uploadModelImage")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Ornament Images */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 flex-wrap">
                                    <div className="w-2 h-2 bg-[#7753ff] rounded-full"></div>
                                    {t("images.ornamentImages")}<span className="text-red-500 ml-1">*</span>
                                    <span className="text-xs text-gray-500 font-normal">upload the product image which is captured with the help of scale for better measurements.</span>
                                    <button type="button" onClick={(e) => { e.preventDefault(); setShowReferenceModal(true); }} className="text-xs text-blue-600 hover:underline font-medium">(View reference)</button>
                                    {uploadErrors.ornamentImages && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    {uploadErrors.ornamentImages}
  </p>
)}

                                </label>
                                <div
  className={`border-2 border-dashed rounded-xl p-6 cursor-pointer ${
    uploadErrors.ornamentImages
      ? "border-red-500 bg-red-50"
      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
  }`}
  onClick={() => document.getElementById("ornament-images")?.click()}
>

                                    <input
                                        type="file"
                                        id="ornament-images"
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) =>
                                            handleOrnamentImagesChange(e.target.files, e.target)
                                          }
                                          
                                          
                                    />
                                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                        <p className="text-sm text-gray-500">{t("images.uploadOneOrMoreOrnaments")}</p>
                                    </div>
                                </div>
                                {ornamentPreviews.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 gap-3">
                                        {ornamentPreviews.map((preview, index) => {
                                            const selectedTypeId = formData.ornamentTypes?.[index] || ""
                                            const selectedType = ORNAMENT_TYPES.find(
                                                (type) => type.id === selectedTypeId
                                            )
                                            const measurementsForThis =
                                                (formData.ornamentMeasurements || [])[index] || {}

                                            return (
                                                <div key={index} className="relative group space-y-2">
                                                    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-gray-200">
                                                        <Image
                                                            src={preview}
                                                            alt={`Ornament ${index + 1}`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOrnament(index)}
                                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <div className="mt-1 space-y-2">
                                                        <OrnamentTypeSelect
                                                            selectedType={selectedTypeId}
                                                            onTypeChange={(typeId) => handleOrnamentTypeChange(index, typeId)}
                                                            size="sm"
                                                            placeholder="Select type"
                                                            label="Ornament type"
                                                            showLabel={true}
                                                        />

                                                        {selectedType && selectedType.measurements?.length > 0 && (
  <div className="mt-2 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
    
    {/* Header (dropdown-like button) */}
    <button
      type="button"
      onClick={() => toggleMeasurements(index)}
      className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
    >
      <span>
        Measurements (
        {
          Object.keys(measurementsForThis).filter(
            key => measurementsForThis[key]
          ).length
        }{" "}
        added)
      </span>

      <span className={`transition-transform ${
        openMeasurements[index] ? "rotate-180" : ""
      }`}>
        ▼
      </span>
    </button>

    {/* Expandable content */}
    {openMeasurements[index] && (
      <div className="p-3 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {selectedType.measurements.map((measurement) => (
            <div key={measurement.id} className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">
                {measurement.label}
                {measurement.unit && (
                  <span className="text-gray-400 ml-1">
                    ({measurement.unit})
                  </span>
                )}
              </label>

              <input
                type="text"
                placeholder={measurement.placeholder}
                value={measurementsForThis[measurement.id] || ""}
                onChange={(e) =>
                  handleOrnamentMeasurementChange(
                    index,
                    measurement.id,
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7753ff]/30"
              />
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}


                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Theme Images */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-[#7753ff] rounded-full"></div>
                                    {t("images.themeStyleImages")} ({t("common.optional")})
                                    {uploadErrors.themeImages && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    {uploadErrors.themeImages}
  </p>
)}

                                </label>
                                <div
  className={`border-2 border-dashed rounded-xl p-6 cursor-pointer ${
    uploadErrors.themeImages
      ? "border-red-500 bg-red-50"
      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
  }`}
  onClick={() => document.getElementById("theme-images")?.click()}
>

                                    <input
                                        type="file"
                                        id="theme-images"
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) =>
                                            handleThemeImagesChange(e.target.files, e.target)
                                          }
                                          
                                    />
                                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                        <p className="text-sm text-gray-500">{t("images.uploadThemeReferenceImages")}</p>
                                    </div>
                                </div>
                                {themePreviews.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 gap-3">
                                        {themePreviews.map((preview, index) => (
                                            <div key={index} className="relative group">
                                                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-gray-200">
                                                    <Image src={preview} alt={`Theme ${index + 1}`} fill className="object-cover" />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeTheme(index)}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Campaign Instructions */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#7753ff]" />
                                    {t("images.campaignInstructions")} ({t("common.optional")})
                                </label>
                                <textarea
                                    value={formData.prompt}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={t("images.addSpecificInstructionsForCampaign")}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7753ff] focus:border-transparent resize-none shadow-sm"
                                    rows="3"
                                />
                            </div>

                            {/* Number of images */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <MdPhotoSizeSelectLarge size={18} className="text-[#7753ff]" />
                                    {t("images.numberOfImages") || "Number of images"}
                                </label>
                                <div className="flex flex-wrap items-center gap-4">
                                    <input type="number" min={MIN_IMAGES} max={MAX_IMAGES} value={numImages} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setNumImages(Math.max(MIN_IMAGES, Math.min(MAX_IMAGES, v))); }} className="w-24 px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7753ff]" />
                                    <span className="text-gray-500 text-sm">{MIN_IMAGES}–{MAX_IMAGES} {t("images.images") || "images"}</span>
                                </div>
                            </div>
                            <DimensionsSelector
                                selectedDimension={formData.dimension}
                                onDimensionChange={(dimension) => setFormData((prev) => ({ ...prev, dimension }))}
                                primaryColor="#7753ff"
                            />

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-8 border-t border-[#e6e6e6]">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex items-center gap-3 px-6 py-3 text-[#7753ff] font-semibold hover:bg-[#7753ff]/10 rounded-xl transition-all duration-300 hover:scale-105"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    {t("common.back")}
                                </button>
                                <div ref={generateSectionRef} className="flex flex-col items-end gap-2">
                                    {showCostNote && numImages > 1 && (
                                        <div className="flex items-center gap-2 px-4 py-3 
bg-gray-100/80 
border border-gray-200 
rounded-xl 
text-gray-800 text-sm">

                                            <Coins className="w-5 h-5 text-amber-600 shrink-0" />
                                            <span>{t("images.creditsCost") || "Cost:"} {numImages * (creditSettings.credits_per_image_generation || 2)} {t("images.credits") || "credits"}. {t("images.clickGenerateAgainToConfirm") || "Click Generate again to confirm."}</span>
                                        </div>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="bg-[#7753ff] hover:bg-[#6a47e6] text-white px-8 py-3 rounded-xl flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {t("images.generating")}
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                {t("images.generateCampaignShots")}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Result Preview */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                        <h3 className="text-2xl font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-[#7753ff]" />
                            {t("images.campaignShotPreview")}
                        </h3>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-[600px] text-center">
                                <Loader2 className="w-16 h-16 text-[#7753ff] animate-spin mb-4" />
                                <p className="text-[#737373] text-lg">{t("images.creatingCampaignShot")}</p>
                                <p className="text-[#737373] text-sm mt-2">{t("images.mayTakeUpTo45Seconds")}</p>
                            </div>
                        ) : result ? (
                            <div className="space-y-6">
                                {result.images && result.images.length > 0 ? (
                                    <>
                                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                            <p className="text-green-700 font-semibold">✓ {t("images.campaignShotGeneratedSuccess")} ({result.images.length} {t("images.images") || "images"})</p>
                                        </div>
                                        <div className="flex flex-col gap-6">
                                            {result.images.map((img, idx) => (
                                                <div key={img.mongo_id || idx} className="rounded-xl border-2 border-[#7753ff]/20 overflow-hidden bg-gray-50">
                                                    <div className="relative w-full h-[450px]">
                                                        <Image
                                                            src={img.generated_image_url}
                                                            alt={`Campaign ${idx + 1}`}
                                                            fill
                                                            sizes="100vw"
                                                            unoptimized
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                    <div className="p-4 flex flex-wrap gap-3 justify-center border-t border-[#7753ff]/10 items-center">
                                                        <span className="text-sm font-medium text-[#7753ff] bg-white/90 px-2 py-1 rounded border border-[#7753ff]/20">Image {idx + 1}</span>
                                                        <button type="button" onClick={() => handleView(img)} className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 flex items-center gap-2"><Eye size={16} />{t("images.view")}</button>
                                                        <button type="button" onClick={() => downloadImage(img.generated_image_url, `campaign-${idx + 1}.png`)} className="px-4 py-3 bg-[#7753ff] text-white rounded-xl font-semibold flex items-center gap-2"><Download size={16} />{t("images.download")}</button>
                                                        <button type="button" onClick={() => handleRegenerate({ ...img, index: idx })} className="px-4 py-3 border-2 border-[#7753ff] text-[#7753ff] rounded-xl font-semibold hover:bg-[#7753ff]/10 flex items-center gap-2"><RefreshCw size={16} />{t("images.regenerate")}</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => { setResult(null); setFormData({ modelType: "ai_model", modelImage: null, ornamentImages: [], ornamentNames: [], ornamentTypes: [], ornamentMeasurements: [], themeImages: [], prompt: "", dimension: "1:1" }); setModelPreview(null); setOrnamentPreviews([]); setThemePreviews([]); setThemeReferenceAnalyses([]); }} className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50">{t("images.newCampaign")}</button>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative w-full h-[550px] rounded-2xl overflow-hidden border-2 border-[#7753ff]/20">
                                            <Image
                                                src={result.generated_image_url}
                                                alt="Campaign Shot"
                                                fill
                                                sizes="100vw"
                                                unoptimized
                                                className="object-contain bg-gray-50"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                                <p className="text-green-700 font-semibold">✓ {t("images.campaignShotGeneratedSuccess")}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button onClick={() => handleView(result)} className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"><Eye size={16} />{t("images.view")}</button>
                                                <button onClick={() => downloadImage(result.generated_image_url, "campaign-shot.png")} className="px-4 py-3 bg-gradient-to-r from-[#884cff] to-[#5a2fcf] text-white rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"><Download size={16} />{t("images.download")}</button>
                                                <button onClick={() => handleRegenerate(result)} className="px-4 py-3 border-2 border-[#7753ff] text-[#7753ff] hover:bg-[#7753ff]/10 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"><RefreshCw size={16} />{t("images.regenerate")}</button>
                                            </div>
                                            <button onClick={() => { setResult(null); setFormData({ modelType: "ai_model", modelImage: null, ornamentImages: [], ornamentNames: [], ornamentTypes: [], ornamentMeasurements: [], themeImages: [], prompt: "", dimension: "1:1" }); setModelPreview(null); setOrnamentPreviews([]); setThemePreviews([]); setThemeReferenceAnalyses([]); }} className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50">{t("images.newCampaign")}</button>
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                <p className="text-blue-700 text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" />{t("images.clickRegenerateToModify")}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[600px] text-center">
                                <div className="w-24 h-24 bg-[#7753ff]/10 rounded-full flex items-center justify-center mb-4">
                                    <Award className="w-12 h-12 text-[#7753ff]" />
                                </div>
                                <p className="text-[#737373] text-lg">{t("images.campaignShotWillAppear")}</p>
                                <p className="text-[#737373] text-sm mt-2">{t("images.uploadOrnamentsAndConfigure")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ReferenceImagesModal open={showReferenceModal} onOpenChange={setShowReferenceModal} />

            {/* Regenerate Modal */}
            {regenerateModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#7753ff] rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#1a1a1a]">{t("images.regenerateCampaignShot")}</h2>
                                        <p className="text-sm text-gray-500">{t("images.modifyAndRegenerateCampaignShot")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeRegenerateModal}
                                    disabled={regenerateModal.loading}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Current Image */}
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-3">{t("images.currentImage")}:</p>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                                    <Image
                                        src={result.generated_image_url}
                                        alt="Current image"
                                        fill
                                        className="object-contain bg-gray-50"
                                    />
                                </div>
                            </div>

                            {/* Original Prompt
                            {result.prompt && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-900 mb-2">{t("images.originalPrompt")}:</p>
                                    <p className="text-sm text-blue-700">{result.prompt}</p>
                                </div>
                            )} */}

                            {/* New Prompt Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#7753ff]" />
                                    {t("images.whatWouldYouLikeToChange")}
                                </label>
                                <textarea
                                    value={regenerateModal.prompt}
                                    onChange={(e) => setRegenerateModal(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={t("images.regeneratePromptPlaceholder")}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7753ff] focus:border-transparent resize-none"
                                    rows="4"
                                    disabled={regenerateModal.loading}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 {t("images.modificationWillBeApplied")}
                                </p>
                            </div>

                            {/* Error Message */}
                            {regenerateModal.error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 text-sm">{regenerateModal.error}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={closeRegenerateModal}
                                    disabled={regenerateModal.loading}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    {t("common.cancel")}
                                </button>
                                <button
                                    onClick={submitRegenerate}
                                    disabled={regenerateModal.loading || !regenerateModal.prompt.trim()}
                                    className="flex-1 px-6 py-3 bg-[#7753ff] text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {regenerateModal.loading ? (
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

                            {/* Loading Info */}
                            {regenerateModal.loading && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-yellow-800 text-sm text-center">
                                        ⏱️ {t("images.mayTakeUpTo45Seconds")}
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
