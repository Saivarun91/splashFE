"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, Upload, Cpu, Ruler, Zap, Loader2, CheckCircle, AlertCircle, RefreshCw, X, Download } from "lucide-react"
import { apiService } from "@/lib/api"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import { OrnamentSelection } from "@/components/images/OrnamentSelection"
import { DimensionsSelector } from "@/components/images/DimensionsSelector"
import toast from "react-hot-toast"
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];


export default function AIModelForm() {
    const router = useRouter()
    const [uploadErrors, setUploadErrors] = useState({
        ornamentImage: null,
        poseImage: null,
      });
      
    const { token } = useAuth()
    const { t } = useLanguage()
    const [formData, setFormData] = useState({
        ornamentImage: null,
        poseImage: null,
        prompt: "",
        measurements: "",
        dimension: "1:1",
    })
    const [ornamentType, setOrnamentType] = useState("")
    const [ornamentMeasurements, setOrnamentMeasurements] = useState({})
    const [ornamentPreview, setOrnamentPreview] = useState(null)
    const [posePreview, setPosePreview] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [regenerateModal, setRegenerateModal] = useState({
        isOpen: false,
        prompt: '',
        loading: false,
        error: null
    })

    const handleFileChange = (type, file, inputEl) => {
        if (!file) return;
      
        // clear previous error for this field
        setUploadErrors((prev) => ({ ...prev, [type]: null }));
      
        // ❌ size validation
        if (file.size > MAX_IMAGE_BYTES) {
          setUploadErrors((prev) => ({
            ...prev,
            [type]: "File size exceeded. Maximum allowed size is 10MB.",
          }));
          if (inputEl) inputEl.value = "";
          return;
        }
      
        // ❌ type validation
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          setUploadErrors((prev) => ({
            ...prev,
            [type]: "Only JPG, PNG, or WEBP images are allowed.",
          }));
          if (inputEl) inputEl.value = "";
          return;
        }
      
        // ✅ valid file
        setFormData((prev) => ({ ...prev, [type]: file }));
      
        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === "ornamentImage") setOrnamentPreview(reader.result);
          else if (type === "poseImage") setPosePreview(reader.result);
        };
        reader.readAsDataURL(file);
      };
      

    const handleRegenerate = () => {
        setRegenerateModal({
            isOpen: true,
            prompt: '',
            loading: false,
            error: null
        })
    }

    const downloadImage = async (url, filename = "image.png") => {
        try {
            const response = await fetch(url, {
                mode: 'cors',
                cache: 'no-cache'
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

            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                link.remove();
                window.URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            console.error('Error downloading image:', error);
            // Fallback: open in new tab
            window.open(url, '_blank');
                toast.error(t("images.downloadFailed"));
        }
    };
      
    const submitRegenerate = async () => {
        if (!regenerateModal.prompt.trim()) {
            setRegenerateModal(prev => ({
                ...prev,
                error: t("images.pleaseEnterPrompt")
            }))
            return
        }

        setRegenerateModal(prev => ({ ...prev, loading: true, error: null }))

        try {
            const response = await apiService.regenerateImage(
                result.mongo_id,
                regenerateModal.prompt, token
            )

            if (response.success) {
                setResult({
                    ...result,
                    generated_image_url: response.generated_image_url,
                    mongo_id: response.mongo_id,
                    prompt: response.combined_prompt
                })

                setRegenerateModal({
                    isOpen: false,
                    prompt: '',
                    loading: false,
                    error: null
                })

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
                error: null
            })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setResult(null)

        if (!formData.ornamentImage) {
            setError(t("images.pleaseUploadOrnamentImage"))
            return
        }

        setIsLoading(true)

        try {
            const formDataToSend = new FormData()
            formDataToSend.append("ornament_image", formData.ornamentImage)
            if (formData.poseImage) {
                formDataToSend.append("pose_style", formData.poseImage)
            }
            formDataToSend.append("prompt", formData.prompt || t("images.generateAIModelWearingOrnament"))
            formDataToSend.append("measurements", formData.measurements || "")
            formDataToSend.append("ornament_type", ornamentType || "")
            formDataToSend.append("ornament_measurements", JSON.stringify(ornamentMeasurements))
            formDataToSend.append("dimension", formData.dimension)

            const response = await apiService.generateModelWithOrnament(formDataToSend, token)

            if (response.status === "success") {
                setResult(response)
            } else {
                setError(response.message || t("images.failedToGenerate"))
            }
        } catch (err) {
            console.error("Error generating image:", err)
            setError(err.message || t("images.errorGeneratingImage"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fcfcfc] via-[#f8f7ff] to-[#f5f3ff] p-8">
            <div className="max-w-6xl mx-auto">
                {/* Enhanced Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg">
                            <Cpu className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1a1a1a] to-purple-600 bg-clip-text text-transparent">
                                {t("images.aiModelGeneration")}
                            </h1>
                            <p className="text-[#737373] mt-2">{t("images.generateAIModelsWearingProducts")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full w-fit border border-purple-200">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">{t("images.aiPowered")}</span>
                    </div>
                </div>

                {/* Form and Result Container */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Ornament Image */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"></div>
                                    {t("images.ornamentProductImage")}<span className="text-red-500 ml-1">*</span>
                                    {uploadErrors.ornamentImage && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    {uploadErrors.ornamentImage}
  </p>
)}

                                </label>
                                <div
  className={`border-2 border-dashed rounded-xl p-6 transition-colors group cursor-pointer ${
    uploadErrors.ornamentImage
      ? "border-red-500 bg-red-50"
      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
  }`}
  onClick={() => document.getElementById("ornament-input")?.click()}
>

                                    <input
                                        type="file"
                                        id="ornament-input"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleFileChange("ornamentImage", e.target.files?.[0], e.target)
                                          }
                                          
                                    />
                                    {ornamentPreview ? (
                                        <div className="relative w-full h-40">
                                            <Image src={ornamentPreview} alt="Ornament Preview" fill className="object-contain rounded-lg" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                            <p className="text-sm text-gray-500">{t("images.pngJpgWebpUpTo15MB")}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pose Style */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"></div>
                                    Pose Style Reference (Optional)
                                    {uploadErrors.poseImage && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    {uploadErrors.poseImage}
  </p>
)}

                                </label>
                                <div
  className={`border-2 border-dashed rounded-xl p-6 transition-colors group cursor-pointer ${
    uploadErrors.poseImage
      ? "border-red-500 bg-red-50"
      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
  }`}
  onClick={() => document.getElementById("pose-input")?.click()}
>

                                    <input
                                        type="file"
                                        id="pose-input"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleFileChange("poseImage", e.target.files?.[0], e.target)
                                          }
                                          
                                    />
                                    {posePreview ? (
                                        <div className="relative w-full h-40">
                                            <Image src={posePreview} alt="Pose Preview" fill className="object-contain rounded-lg" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                            <p className="text-sm text-gray-500">{t("images.uploadReferencePoseImage")}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ornament Selection */}
                            <OrnamentSelection
                                selectedType={ornamentType}
                                onTypeChange={setOrnamentType}
                                measurements={ornamentMeasurements}
                                onMeasurementsChange={setOrnamentMeasurements}
                            />

                            {/* Legacy Measurements (Optional) */}
                            {/* <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Ruler className="w-4 h-4 text-purple-600" />
                                    Additional Measurements (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="E.g., Length: 5cm, Width: 3cm"
                                    value={formData.measurements}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, measurements: e.target.value }))}
                                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                                />
                            </div> */}

                            {/* Custom Prompt */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    {t("images.customInstructions")} ({t("common.optional")})
                                </label>
                                <textarea
                                    value={formData.prompt}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={t("images.addSpecificInstructionsForAIModel")}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none shadow-sm"
                                    rows="3"
                                />
                            </div>

                            {/* Dimensions */}
                            <DimensionsSelector
                                selectedDimension={formData.dimension}
                                onDimensionChange={(dimension) => setFormData((prev) => ({ ...prev, dimension }))}
                                primaryColor="#9333ea"
                            />

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <p className="text-red-700 text-sm">{t("common.somethingWentWrong")}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors group"
                                >
                                    <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                                    {t("common.back")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
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
                    </div>

                    {/* Result Preview */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                        <h3 className="text-2xl font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-purple-600" />
                            {t("images.generatedModel")}
                        </h3>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-[500px] text-center">
                                <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-4" />
                                <p className="text-[#737373] text-lg">{t("images.generatingAIModel")}</p>
                                <p className="text-[#737373] text-sm mt-2">{t("images.mayTakeUpTo30Seconds")}</p>
                            </div>
                        ) : result ? (
                            <div className="space-y-6">
                                <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border-2 border-purple-200">
                                    <Image
                                        src={result.generated_image_url}
                                        alt="Generated AI Model"
                                        fill
                                        className="object-contain bg-gray-50"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                        <p className="text-green-700 font-semibold">✓ {t("images.aiModelGeneratedSuccess")}</p>
                                        {result.mongo_id && (
                                            <p className="text-green-600 text-xs mt-1">{t("images.imageId")}: {result.mongo_id}</p>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() =>
                                                downloadImage(result.generated_image_url, "ai-model-generated.png")
                                            }
                                            className="px-4 py-3 bg-gradient-to-r from-[#884cff] to-[#5a2fcf] text-white rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Download size={16} />
                                            {t("images.download")}
                                        </button>

                                            <button
                                                onClick={handleRegenerate}
                                                className="px-4 py-3 border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={16} />
                                                {t("images.regenerate")}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setResult(null)
                                                setFormData({
                                                    ornamentImage: null,
                                                    poseImage: null,
                                                    prompt: "",
                                                    measurements: "",
                                                    dimension: "1:1",
                                                })
                                                setOrnamentType("")
                                                setOrnamentMeasurements({})
                                                setOrnamentPreview(null)
                                                setPosePreview(null)
                                            }}
                                            className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                                        >
                                            {t("images.newModel")}
                                        </button>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <p className="text-blue-700 text-sm flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            {t("images.clickRegenerateToModifyAIModel")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[500px] text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                                    <Cpu className="w-12 h-12 text-purple-600" />
                                </div>
                                <p className="text-[#737373] text-lg">{t("images.aiModelWillAppear")}</p>
                                <p className="text-[#737373] text-sm mt-2">{t("images.uploadOrnamentAndClickGenerate")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Regenerate Modal */}
            {regenerateModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex-shrink-0 border-b border-gray-200 bg-white p-6 rounded-t-3xl z-10 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#1a1a1a]">{t("images.regenerateAIModel")}</h2>
                                        <p className="text-sm text-gray-500">{t("images.modifyAndRegenerateAIModel")}</p>
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
                        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
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
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    {t("images.whatWouldYouLikeToChange")}
                                </label>
                                <textarea
                                    value={regenerateModal.prompt}
                                    onChange={(e) => setRegenerateModal(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={t("images.regenerateAIModelPlaceholder")}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                                    rows="4"
                                    disabled={regenerateModal.loading}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 {t("images.modificationWillBeAppliedToAIModel")}
                                </p>
                            </div>

                            {/* Error Message */}
                            {regenerateModal.error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 text-sm">{t("common.somethingWentWrong")}</p>
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
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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
