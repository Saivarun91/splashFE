"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Star, Sparkles, Upload, Image as ImageIcon, Settings, Loader2, CheckCircle, AlertCircle, RefreshCw, X, Download, Eye, Coins } from "lucide-react"
import { MdPhotoSizeSelectLarge } from "react-icons/md"
import { apiService } from "@/lib/api"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import toast from "react-hot-toast"
import { DimensionsSelector } from "@/components/images/DimensionsSelector"
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_IMAGES = 1;
const MAX_IMAGES = 10;
const IMAGE_LABELS = {
    productImage: "Product image",
    referenceImage: "Reference image",
  };

  
  
const BackgroundReplaceForm = () => {
    const router = useRouter()
    const { t } = useLanguage()

    const [formData, setFormData] = useState({
        productImage: null,
        referenceImage: null,
        backgroundColor: "#ffffff",
        prompt: "",
        dimension: "1:1",
    })
    const [uploadErrors, setUploadErrors] = useState({
        productImage: null,
        referenceImage: null,
      });
    const [productPreview, setProductPreview] = useState(null)
    const [referencePreview, setReferencePreview] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const { token } = useAuth()
    const [numImages, setNumImages] = useState(1)
    const [creditSettings, setCreditSettings] = useState({ credits_per_image_generation: 2 })
    const [regenerateModal, setRegenerateModal] = useState({
        isOpen: false,
        prompt: '',
        loading: false,
        error: null,
        image: null
    })

    useEffect(() => {
        let cancelled = false
        apiService.getImageCreditSettings(token).then((s) => {
            if (!cancelled && s) setCreditSettings(s)
        })
        return () => { cancelled = true }
    }, [token])

    const handleRegenerate = (imageItem = null) => {
        setRegenerateModal({
            isOpen: true,
            prompt: '',
            loading: false,
            error: null,
            image: imageItem ?? (result?.generated_image_url ? result : null)
        })
    }

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
            
            toast.success('Download started!');
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
                toast.success('Download started!');
            } catch (fallbackError) {
                console.error('Fallback download also failed:', fallbackError);
                // Last resort: open in new tab
                window.open(url, '_blank');
                toast.error('Download failed. Image opened in new tab.');
            }
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
            const target = regenerateModal.image || result
            if (!target?.mongo_id) {
                setRegenerateModal(prev => ({ ...prev, loading: false, error: 'Cannot regenerate: missing image ID.' }))
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
    const handleFileChange = (type, file, inputEl) => {
        if (!file) return;
      
        // Clear previous error for this field
        setUploadErrors((prev) => ({ ...prev, [type]: null }));
      
        // ❌ Size validation
        if (file.size > MAX_IMAGE_BYTES) {
          setUploadErrors((prev) => ({
            ...prev,
            [type]: "File size exceeded. Maximum allowed size is 10MB.",
          }));
          inputEl.value = ""; // critical for reselect
          return;
        }
      
        // ❌ Type validation (optional but recommended)
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          setUploadErrors((prev) => ({
            ...prev,
            [type]: "Only JPG, PNG, or WEBP images are allowed.",
          }));
          inputEl.value = "";
          return;
        }
      
        // ✅ Valid file
        setFormData((prev) => ({ ...prev, [type]: file }));
      
        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === "productImage") {
            setProductPreview(reader.result);
          } else if (type === "referenceImage") {
            setReferencePreview(reader.result);
          }
        };
        reader.readAsDataURL(file);
      };
      
      

      

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setResult(null)

        if (!formData.productImage) {
            setError(t("images.pleaseUploadProductImage"))
            return
        }

        setIsLoading(true)

        try {
            const formDataToSend = new FormData()
            formDataToSend.append("ornament_image", formData.productImage)
            if (formData.referenceImage) {
                formDataToSend.append("background_image", formData.referenceImage)
            }
            formDataToSend.append("background_color", formData.backgroundColor)
            formDataToSend.append("prompt", formData.prompt || t("images.changeTheBackground"))
            formDataToSend.append("dimension", formData.dimension)
            formDataToSend.append("num_images", String(numImages))

            const response = await apiService.changeBackground(formDataToSend, token)

            if (response && (response.success !== false)) {
                setResult(response)
            } else {
                setError(response.error || t("images.failedToGenerate"))
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
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-10 w-40 h-40 bg-[#7753ff]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-[#7753ff]/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-[#7753ff] rounded-2xl shadow-lg">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1a1a1a] to-[#884cff] bg-clip-text text-transparent">
                               {t("images.themedImage")}
                            </h1>
                            <p className="text-[#737373] mt-2">{t("images.aiPoweredTransformation")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#7753ff]/10 rounded-full w-fit border border-[#7753ff]/20">
                        <Star className="w-4 h-4 text-[#7753ff]" />
                        <span className="text-sm font-medium text-[#7753ff]">{t("images.mostPopularTool")}</span>
                    </div>
                </div>

                {/* Form and Result Container */}
                <div className={`grid grid-cols-1 gap-8 transition-all duration-500 ${result ? 'lg:grid-cols-[4fr_6fr]' : 'lg:grid-cols-[7fr_3fr]'}`}>
                    {/* Form Container */}
                    <div className="space-y-8 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Product Image */}
                            <div>
                                <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-[#7753ff]" />
                                    {t("images.productImage")}<span className="text-red-500 ml-1">*</span>
                                    {uploadErrors.productImage && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-0=">
    <AlertCircle className="w-4 h-4" />
    {uploadErrors.productImage}
  </p>
)}

                                </label>
                                <div
  className={`border-2 border-dashed rounded-2xl p-6 transition-all duration-300 cursor-pointer ${
    uploadErrors?.productImage
      ? "border-red-500 bg-red-50"
      : isDragging
      ? "border-[#7753ff] bg-[#7753ff]/5"
      : "border-[#e6e6e6] hover:border-[#7753ff] hover:bg-[#7753ff]/5"
  }`}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onClick={() => document.getElementById("product-image").click()}
>

                                    <input
  type="file"
  id="product-image"
  className="hidden"
  accept="image/*"
  onChange={(e) =>
    handleFileChange(
      "productImage",
      e.target.files?.[0] || null,
      e.target
    )
  }
/>

                                    {productPreview ? (
                                        <div className="relative w-full h-40">
                                            <Image src={productPreview} alt="Product Preview" fill className="object-contain rounded-lg" />
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="w-12 h-12 text-[#7753ff] mx-auto mb-3" />
                                            <p className="text-[#1a1a1a] font-medium mb-1">{t("images.uploadProductImage")}</p>
                                            <p className="text-[#737373] text-sm">{t("images.pngJpgUpTo10MB")}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reference Background Image */}
                            <div>
                                <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-[#7753ff]" />
                                    Reference Background Image
                                    {uploadErrors.referenceImage && (
  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    {uploadErrors.referenceImage}
  </p>
)}
                                </label>
                                
                                <div
  className={`border-2 border-dashed rounded-2xl p-6 transition-all duration-300 cursor-pointer ${
    uploadErrors?.referenceImage
      ? "border-red-500 bg-red-50"
      : "border-[#e6e6e6] hover:border-[#884cff] hover:bg-[#884cff]/5"
  }`}
  onClick={() => document.getElementById("reference-image").click()}
>

                                    <input
  type="file"
  id="reference-image"
  className="hidden"
  accept="image/*"
  onChange={(e) =>
    handleFileChange(
      "referenceImage",
      e.target.files?.[0] || null,
      e.target
    )
  }
/>



                                    {referencePreview ? (
                                        <div className="relative w-full h-40">
                                            <Image src={referencePreview} alt="Reference Preview" fill className="object-contain rounded-lg" />
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="w-12 h-12 text-[#7753ff] mx-auto mb-3" />
                                            <p className="text-[#1a1a1a] font-medium mb-1">Upload Reference Image</p>
                                            <p className="text-[#737373] text-sm">Optional - for style reference</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Background Color */}
                            {/* <div>
                                <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-[#7753ff]" />
                                    Background Color
                                </label>
                                <div className="flex items-center gap-4 p-4 bg-[#f8f7ff] rounded-2xl border border-[#e6e6e6]">
                                    <input
                                        type="color"
                                        value={formData.backgroundColor}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                                        className="w-16 h-16 rounded-2xl cursor-pointer border-2 border-white shadow-lg"
                                    />
                                    <input
                                        type="text"
                                        value={formData.backgroundColor}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                                        className="flex-1 px-4 py-3 border border-[#e6e6e6] rounded-xl bg-white text-[#1a1a1a] font-mono focus:outline-none focus:ring-2 focus:ring-[#7753ff] focus:border-transparent"
                                    />
                                </div>
                            </div> */}

                            {/* Custom Prompt */}
                            <div>
                                <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#7753ff]" />
                                    {t("images.customPrompt")} ({t("common.optional")})
                                </label>
                                <textarea
                                    value={formData.prompt}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={t("images.addSpecificInstructions")}
                                    className="w-full px-4 py-3 border border-[#e6e6e6] rounded-xl bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7753ff] focus:border-transparent resize-none"
                                    rows="3"
                                />
                            </div>

                            {/* Dimensions */}
                            {/* Number of images */}
                            <div>
                                <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                    <MdPhotoSizeSelectLarge size={20} className="text-[#7753ff]" />
                                    {t("images.numberOfImages") || "Number of images"}
                                </label>
                                <div className="flex flex-wrap items-center gap-4">
                                    <input
                                        type="number"
                                        min={MIN_IMAGES}
                                        max={MAX_IMAGES}
                                        value={numImages}
                                        onChange={(e) => {
                                            const v = parseInt(e.target.value, 10)
                                            if (!isNaN(v)) setNumImages(Math.max(MIN_IMAGES, Math.min(MAX_IMAGES, v)))
                                        }}
                                        className="w-24 px-4 py-3 border border-[#e6e6e6] rounded-xl bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7753ff] focus:border-transparent"
                                    />
                                    <span className="text-[#737373] text-sm">{MIN_IMAGES}–{MAX_IMAGES} {t("images.images") || "images"}</span>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                                        <Coins className="w-5 h-5 text-amber-600" />
                                        <span className="text-amber-800 font-semibold">{t("images.creditsCost") || "Cost:"} {numImages * (creditSettings.credits_per_image_generation || 2)} {t("images.credits") || "credits"}</span>
                                    </div>
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
                                    <p className="text-red-700 text-sm">{t("common.somethingWentWrong")}</p>
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
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center gap-3 px-8 py-4 bg-[#7753ff] hover:bg-[#6a47e6] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-[#7753ff]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
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
                        </form>
                    </div>

                    {/* Result Preview */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
                        <h3 className="text-2xl font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-[#7753ff]" />
                            {t("images.resultPreview")}
                        </h3>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-[500px] text-center">
                                <Loader2 className="w-16 h-16 text-[#7753ff] animate-spin mb-4" />
                                <p className="text-[#737373] text-lg">{t("images.replacingBackground")}</p>
                                <p className="text-[#737373] text-sm mt-2">{t("images.mayTakeFewMoments")}</p>
                            </div>
                        ) : result ? (
                            <div className="space-y-6">
                                {result.images && Array.isArray(result.images) ? (
                                    <>
                                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                            <p className="text-green-700 font-semibold">✓ {t("images.themedImageGeneratedSuccess")} ({result.images.length} {t("images.images") || "images"})</p>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {result.images.map((img, idx) => (
                                                <div key={img.mongo_id || idx} className="rounded-xl border-2 border-[#7753ff]/20 overflow-hidden bg-gray-50">
                                                    <div className="relative aspect-square">
                                                        <Image src={img.generated_image_url} alt={`Generated ${idx + 1}`} fill className="object-contain" />
                                                    </div>
                                                    <div className="p-2 flex flex-wrap gap-1 justify-center">
                                                        <button type="button" onClick={() => handleView(img.generated_image_url)} className="p-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"><Eye size={14} /></button>
                                                        <button type="button" onClick={() => downloadImage(img.generated_image_url, `themed-${idx + 1}.png`)} className="p-2 bg-[#7753ff] text-white rounded-lg text-xs font-medium"><Download size={14} /></button>
                                                        <button type="button" onClick={() => handleRegenerate({ ...img, index: idx })} className="p-2 border border-[#7753ff] text-[#7753ff] rounded-lg text-xs font-medium hover:bg-[#7753ff]/10"><RefreshCw size={14} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => { setResult(null); setFormData({ productImage: null, referenceImage: null, backgroundColor: "#ffffff", prompt: "", dimension: "1:1" }); setProductPreview(null); setReferencePreview(null); }} className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">{t("images.newImage")}</button>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border-2 border-[#7753ff]/20">
                                            <Image src={result.generated_image_url} alt="Generated" fill className="object-contain bg-gray-50" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                                <p className="text-green-700 font-semibold">✓ {t("images.themedImageGeneratedSuccess")}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button onClick={() => handleView(result.generated_image_url)} className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"><Eye size={16} />{t("images.view")}</button>
                                                <button onClick={() => downloadImage(result.generated_image_url, "themed-image.png")} className="px-4 py-3 bg-gradient-to-r from-[#884cff] to-[#5a2fcf] text-white rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"><Download size={16} />{t("images.download")}</button>
                                                <button onClick={handleRegenerate} className="px-4 py-3 border-2 border-[#7753ff] text-[#7753ff] rounded-xl font-semibold hover:bg-[#7753ff]/10 transition-all flex items-center justify-center gap-2"><RefreshCw size={18} />{t("images.regenerate")}</button>
                                            </div>
                                            <button onClick={() => { setResult(null); setFormData({ productImage: null, referenceImage: null, backgroundColor: "#ffffff", prompt: "", dimension: "1:1" }); setProductPreview(null); setReferencePreview(null); }} className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">{t("images.newImage")}</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[500px] text-center">
                                <div className="w-24 h-24 bg-[#7753ff]/10 rounded-full flex items-center justify-center mb-4">
                                    <Sparkles className="w-12 h-12 text-[#7753ff]" />
                                </div>
                                <p className="text-[#737373] text-lg">{t("images.generatedImageWillAppear")}</p>
                                <p className="text-[#737373] text-sm mt-2">{t("images.uploadImagesAndClickGenerate")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Regenerate Modal */}
            {regenerateModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#7753ff] rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#1a1a1a]">{t("images.regenerateImage")}</h2>
                                        <p className="text-sm text-gray-500">{t("images.modifyAndRegenerateYourImage")}</p>
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

                        <div className="p-6 space-y-6">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-3">{t("images.currentImage")}:</p>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                                    <Image
                                        src={result?.generated_image_url}
                                        alt="Current"
                                        fill
                                        className="object-contain bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#7753ff]" />
                                    {t("images.whatWouldYouLikeToChange")}
                                </label>
                                <textarea
                                    value={regenerateModal.prompt}
                                    onChange={(e) => setRegenerateModal(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={t("images.regeneratePromptPlaceholder")}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#884cff] focus:border-transparent resize-none"
                                    rows="4"
                                    disabled={regenerateModal.loading}
                                />
                            </div>

                            {regenerateModal.error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 text-sm">{t("common.somethingWentWrong")}</p>
                                </div>
                            )}

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
                                            {t("images.regenerate")}
                                        </>
                                    )}
                                </button>
                            </div>

                            {regenerateModal.loading && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-yellow-800 text-sm text-center">
                                        ⏱️ {t("images.mayTake10to30Seconds")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )


    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fcfcfc] via-[#f8f7ff] to-[#f5f3ff] p-8">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-10 w-40 h-40 bg-gradient-to-r from-[#884cff]/10 to-[#5a2fcf]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-gradient-to-r from-[#884cff]/5 to-[#5a2fcf]/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-[#7753ff] rounded-2xl shadow-lg">
                            <ImageIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-[#7753ff]">
                                Background Replace
                            </h1>
                            <p className="text-[#737373] mt-2">
                                Replace product backgrounds with AI-powered precision
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#7753ff]/10 rounded-full w-fit border border-[#7753ff]/20">
                        <Star className="w-4 h-4 text-[#7753ff]" />
                        <span className="text-sm font-medium text-[#7753ff]">Most Popular Tool</span>
                    </div>
                </div>

                {/* Main Content - Styled like first UI */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Card – Product & Options */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-border/40 p-6 lg:p-8 luxury-card">
                        {/* Card header style like first UI */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold tracking-tight">Product & Background Settings</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Upload your product and customize how the background should look
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Product Image */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-[#884cff]" />
                                    Product Image <span className="text-red-500 ml-1">*</span>
                                </label>

                                <div
                                    className={`border-2 border-dashed rounded-xl p-6 lg:p-8 text-center smooth-transition cursor-pointer ${isDragging
                                        ? "border-[#884cff] bg-[#884cff]/5"
                                        : "border-border hover:border-primary/60 hover:bg-primary/5"
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => document.getElementById("product-image")?.click()}
                                >
                                    <input
                                        type="file"
                                        id="product-image"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleFileChange("productImage", e.target.files?.[0] || null)
                                        }
                                    />

                                    {productPreview ? (
                                        <div className="relative w-full h-40 lg:h-48">
                                            <Image
                                                src={productPreview}
                                                alt="Product Preview"
                                                fill
                                                className="object-contain rounded-lg"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                                            <p className="text-sm font-medium text-foreground">
                                                Upload Product Image
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                PNG, JPG up to 10MB
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reference Background Image */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-[#884cff]" />
                                    Reference Background Image
                                    <span className="text-xs text-muted-foreground">(Optional)</span>
                                </label>

                                <div
                                    className="border-2 border-dashed border-border rounded-xl p-6 lg:p-8 text-center hover:border-primary/60 hover:bg-primary/5 smooth-transition cursor-pointer"
                                    onClick={() => document.getElementById("reference-image")?.click()}
                                >
                                    <input
                                        type="file"
                                        id="reference-image"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleFileChange("referenceImage", e.target.files?.[0] || null)
                                        }
                                    />

                                    {referencePreview ? (
                                        <div className="relative w-full h-40 lg:h-48">
                                            <Image
                                                src={referencePreview}
                                                alt="Reference Preview"
                                                fill
                                                className="object-contain rounded-lg"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <ImageIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                                            <p className="text-sm font-medium text-foreground">
                                                Upload Reference Image
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Optional – for style reference
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Background Color */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-[#7753ff]" />
                                    Background Color
                                </label>
                                <div className="flex items-center gap-4 rounded-xl border border-border bg-[#f8f7ff] p-4">
                                    <input
                                        type="color"
                                        value={formData.backgroundColor}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                backgroundColor: e.target.value,
                                            }))
                                        }
                                        className="w-14 h-14 rounded-xl cursor-pointer border border-white shadow-sm"
                                    />
                                    <input
                                        type="text"
                                        value={formData.backgroundColor}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                backgroundColor: e.target.value,
                                            }))
                                        }
                                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#884cff] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Custom Prompt */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#7753ff]" />
                                    Custom Prompt (Optional)
                                </label>
                                <textarea
                                    value={formData.prompt}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, prompt: e.target.value }))
                                    }
                                    placeholder="E.g., 'Soft studio lighting with clean white background...'"
                                    className="w-full px-3 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#884cff] focus:border-transparent resize-none min-h-[100px]"
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <p className="text-sm text-red-700"> Oops! Something went wrong. Please try again.</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-4 flex items-center justify-between border-t border-border/60 mt-2">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-[#884cff] hover:text-[#5a2fcf] smooth-transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back
                                </button>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-[#7753ff] hover:bg-[#6a47e6] text-white text-sm font-semibold shadow-md hover:shadow-lg smooth-transition disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Generate Background (1 Credit)
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Card – Preview (styled like first UI) */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-border/40 p-6 lg:p-8 luxury-card">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-[#884cff]" />
                                    Preview
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    See your generated background in real-time
                                </p>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-[420px] text-center">
                                <div className="w-24 h-24 rounded-full bg-[#7753ff]/10 flex items-center justify-center mb-4">
                                    <Loader2 className="w-10 h-10 text-[#7753ff] animate-spin" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Replacing background with AI magic...
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    This usually completes in a few seconds
                                </p>
                            </div>
                        ) : result ? (
                            <div className="space-y-5">
                                <div className="aspect-[4/5] rounded-xl overflow-hidden border border-border bg-muted relative">
                                    <Image
                                        src={result.generated_image_url}
                                        alt="Generated"
                                        fill
                                        className="object-contain bg-gray-50"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                                        ✓ Background replaced successfully!
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <a
                                            href={result.generated_image_url}
                                            download
                                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-[#7753ff] hover:bg-[#6a47e6] text-white shadow-md hover:shadow-lg smooth-transition"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </a>
                                        <button
                                            onClick={handleRegenerate}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border border-[#884cff] text-[#884cff] hover:bg-[#f3e9ff] smooth-transition"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Regenerate
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setResult(null);
                                            setFormData({
                                                productImage: null,
                                                referenceImage: null,
                                                backgroundColor: "#ffffff",
                                                prompt: "",
                                            });
                                            setProductPreview(null);
                                            setReferencePreview(null);
                                        }}
                                        className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-muted smooth-transition"
                                    >
                                        New Image
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[420px] text-center">
                                <div className="aspect-square w-32 rounded-2xl bg-[#7753ff]/5 flex items-center justify-center mb-4">
                                    <Sparkles className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium text-foreground">
                                    Your generated image will appear here
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                    Upload a product image, optionally add a reference and prompt, then click
                                    <span className="font-semibold"> Generate Background</span>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Regenerate Modal – you can keep this mostly as-is */}
            {regenerateModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-border p-6 rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#7753ff] rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Regenerate Image</h2>
                                        <p className="text-xs text-muted-foreground">
                                            Modify the background and generate an updated version
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeRegenerateModal}
                                    disabled={regenerateModal.loading}
                                    className="p-2 hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                    Current Image
                                </p>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-border bg-muted">
                                    {result && (
                                        <Image
                                            src={result.generated_image_url}
                                            alt="Current"
                                            fill
                                            className="object-contain bg-gray-50"
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#7753ff]" />
                                    What would you like to change?
                                </label>
                                <textarea
                                    value={regenerateModal.prompt}
                                    onChange={(e) =>
                                        setRegenerateModal((prev) => ({
                                            ...prev,
                                            prompt: e.target.value,
                                        }))
                                    }
                                    placeholder="E.g., 'Make the background brighter', 'Change to pastel blue', 'Add soft shadows'..."
                                    className="w-full px-3 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#884cff] focus:border-transparent resize-none min-h-[110px]"
                                    rows={4}
                                    disabled={regenerateModal.loading}
                                />
                            </div>

                            {regenerateModal.error && (
                                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-700"> Oops! Something went wrong. Please try again.</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-border/70">
                                <button
                                    onClick={closeRegenerateModal}
                                    disabled={regenerateModal.loading}
                                    className="flex-1 px-4 py-3 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted smooth-transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitRegenerate}
                                    disabled={regenerateModal.loading || !regenerateModal.prompt.trim()}
                                    className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-[#7753ff] hover:bg-[#6a47e6] text-white shadow-md hover:shadow-lg smooth-transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {regenerateModal.loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Regenerating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Regenerate
                                        </>
                                    )}
                                </button>
                            </div>

                            {regenerateModal.loading && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                    <p className="text-xs text-amber-800 text-center">
                                        ⏱️ This may take a few seconds. Please don&apos;t close the window.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );


}

export default BackgroundReplaceForm
