"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Star, Sparkles, Upload, Image as ImageIcon, Settings, Loader2, CheckCircle, AlertCircle, RefreshCw, X, Download, Eye, Coins } from "lucide-react"
import { MdPhotoSizeSelectLarge } from "react-icons/md"
import { apiService } from "@/lib/api"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import toast from "react-hot-toast"
import { DimensionsSelector } from "@/components/images/DimensionsSelector"
import { NumberOfImagesSelector } from "@/components/images/NumberOfImagesSelector"
import { openImageViewer } from "@/lib/openImageViewer"
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_IMAGES = 1;
const MAX_IMAGES = 3;
const MAX_PRODUCT_IMAGES = 5;
const IMAGE_LABELS = {
    productImage: "Product image",
    referenceImage: "Reference image",
  };

  
  
const BackgroundReplaceForm = () => {
    const router = useRouter()
    const { t } = useLanguage()

    const [formData, setFormData] = useState({
        productImages: [],
        referenceImage: null,
        backgroundColor: "#ffffff",
        prompt: "",
        dimension: "1:1",
    })
    const [uploadErrors, setUploadErrors] = useState({
        productImages: null,
        referenceImage: null,
      });
    const [productPreviews, setProductPreviews] = useState([])
    const [referencePreview, setReferencePreview] = useState(null)
    const [referenceAnalysis, setReferenceAnalysis] = useState("")
    const [referenceAnalysisLoading, setReferenceAnalysisLoading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const { token } = useAuth()
    const [numImages, setNumImages] = useState(1)
    const [creditSettings, setCreditSettings] = useState({ credits_per_image_generation: 2 })
    const [showCostNote, setShowCostNote] = useState(false)
    const generateSectionRef = useRef(null)
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

    const handleRegenerate = (imageItem = null) => {
        // When used as onClick={handleRegenerate}, React passes a SyntheticEvent as first arg.
        // Normalize so we store an image object (or result) instead of the event.
        const isEventLike = imageItem && typeof imageItem === 'object' && 'nativeEvent' in imageItem;
        const normalizedImage = isEventLike ? null : imageItem;

        setRegenerateModal({
            isOpen: true,
            prompt: '',
            loading: false,
            error: null,
            image: normalizedImage ?? (result?.generated_image_url ? result : null)
        })
    }

    const handleView = (selectedImage = null) => {
        const generatedImages =
            result?.images && Array.isArray(result.images)
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
        console.log('[replace-bg] submitRegenerate clicked');

        if (!regenerateModal.prompt.trim()) {
            setRegenerateModal(prev => ({
                ...prev,
                error: t("images.pleaseEnterPrompt")
            }))
            return
        }

        setRegenerateModal(prev => ({ ...prev, loading: true, error: null }))

        try {
            let target = regenerateModal.image || result
            // If we accidentally stored a SyntheticEvent, fall back to result
            if (target && typeof target === 'object' && 'nativeEvent' in target) {
                target = result
            }
            console.log('[replace-bg] target for regenerate:', target);

            // Prefer mongo_id but gracefully fall back to other possible id fields
            const imageId =
                target?.mongo_id ||
                target?.image_id ||
                target?.id ||
                target?.parent_image_id ||
                target?.ornament_id

            console.log('[replace-bg] resolved imageId for regenerate:', imageId);

            if (!imageId) {
                setRegenerateModal(prev => ({ ...prev, loading: false, error: 'Cannot regenerate: missing image ID.' }))
                return
            }

            const response = await apiService.regenerateImage(
                imageId,
                regenerateModal.prompt,
                token
            )

            console.log('[replace-bg] regenerate response:', response);

            // If backend does not send explicit success flag, treat as success if generated_image_url exists
            const isSuccess = response.success !== false && Boolean(response.generated_image_url || response.images);

            if (isSuccess) {
                const updated = {
                    generated_image_url: response.generated_image_url || response?.images?.[0]?.generated_image_url,
                    mongo_id: response.mongo_id || response?.images?.[0]?.mongo_id,
                    prompt: response.combined_prompt || regenerateModal.prompt
                }

                if (result?.images && Array.isArray(result.images)) {
                    const idx = regenerateModal.image?.index ?? 0
                    setResult({
                        ...result,
                        images: result.images.map((img, i) => (i === idx ? { ...img, ...updated } : img))
                    })
                } else {
                    setResult(prev => ({ ...(prev || {}), ...updated }))
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
                error: error?.response?.data?.error || error?.message || t("images.failedToRegenerate")
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
    const handleFileChange = (type, fileOrFiles, inputEl) => {
        if (type === "productImages") {
          const files = fileOrFiles ? (Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles]) : [];
          if (files.length === 0) return;
          setUploadErrors((prev) => ({ ...prev, productImages: null }));
          const toAdd = [];
          for (const file of files) {
            if (file.size > MAX_IMAGE_BYTES) {
              setUploadErrors((prev) => ({ ...prev, productImages: "File size exceeded. Maximum allowed size is 10MB." }));
              if (inputEl) inputEl.value = "";
              return;
            }
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
              setUploadErrors((prev) => ({ ...prev, productImages: "Only JPG, PNG, or WEBP images are allowed." }));
              if (inputEl) inputEl.value = "";
              return;
            }
            toAdd.push(file);
          }
          const newTotal = (formData.productImages?.length || 0) + toAdd.length;
          if (newTotal > MAX_PRODUCT_IMAGES) {
            setUploadErrors((prev) => ({ ...prev, productImages: `Maximum ${MAX_PRODUCT_IMAGES} product images allowed.` }));
            if (inputEl) inputEl.value = "";
            return;
          }
          setFormData((prev) => ({
            ...prev,
            productImages: [...(prev.productImages || []), ...toAdd],
          }));
          toAdd.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => setProductPreviews((prev) => [...prev, reader.result]);
            reader.readAsDataURL(file);
          });
          if (inputEl) inputEl.value = "";
          return;
        }

        if (type === "referenceImage") {
          const file = fileOrFiles;
          if (!file) return;
          setUploadErrors((prev) => ({ ...prev, referenceImage: null }));
          if (file.size > MAX_IMAGE_BYTES) {
            setUploadErrors((prev) => ({ ...prev, referenceImage: "File size exceeded. Maximum allowed size is 10MB." }));
            if (inputEl) inputEl.value = "";
            return;
          }
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setUploadErrors((prev) => ({ ...prev, referenceImage: "Only JPG, PNG, or WEBP images are allowed." }));
            if (inputEl) inputEl.value = "";
            return;
          }
          setFormData((prev) => ({ ...prev, referenceImage: file }));
          const reader = new FileReader();
          reader.onloadend = () => {
            setReferencePreview(reader.result);
            setReferenceAnalysis("");
            setReferenceAnalysisLoading(true);
            apiService.analyzeReferenceImage(file, "themed", token).then((data) => {
              if (data?.success && data.analysis_text) setReferenceAnalysis(data.analysis_text);
            }).catch(() => {}).finally(() => setReferenceAnalysisLoading(false));
          };
          reader.readAsDataURL(file);
          if (inputEl) inputEl.value = "";
        }
      };

    const removeProductImage = (e, index) => {
        e?.stopPropagation?.();
        setFormData((prev) => ({
          ...prev,
          productImages: prev.productImages.filter((_, i) => i !== index),
        }));
        setProductPreviews((prev) => prev.filter((_, i) => i !== index));
        setUploadErrors((prev) => ({ ...prev, productImages: null }));
        const input = document.getElementById("product-image");
        if (input) input.value = "";
    };
    const removeReferenceImage = (e) => {
        e?.stopPropagation?.();
        setFormData((prev) => ({ ...prev, referenceImage: null }));
        setReferencePreview(null);
        setReferenceAnalysis("");
        setUploadErrors((prev) => ({ ...prev, referenceImage: null }));
        const input = document.getElementById("reference-image");
        if (input) input.value = "";
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

        const productImages = formData.productImages || []
        if (productImages.length === 0) {
            setError(t("images.pleaseUploadProductImage"))
            return
        }

        // For single image, optional extra cost note when generating multiple variations
        if (productImages.length === 1 && numImages > 1 && !showCostNote) {
            setShowCostNote(true)
            return
        }
        setShowCostNote(false)

        setIsLoading(true)

        try {
            const formDataToSend = new FormData()
            // Backend currently accepts a single "ornament_image" file for replace background.
            // If multiple product images are selected, use the first one to keep request valid.
            formDataToSend.append("ornament_image", productImages[0])
            if (formData.referenceImage) {
                formDataToSend.append("background_image", formData.referenceImage)
            }
            if (referenceAnalysis) formDataToSend.append("reference_analysis", referenceAnalysis)
            formDataToSend.append("background_color", formData.backgroundColor)
            formDataToSend.append("prompt", formData.prompt || t("images.changeTheBackground"))
            formDataToSend.append("dimension", formData.dimension)
            formDataToSend.append("num_images", String(productImages.length === 1 ? numImages : 1))

            if (productImages.length > 1) {
                toast(
                    "Multiple product images are not supported yet for this tool. Using the first image.",
                    { icon: "ℹ️" }
                )
            }

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
                            {/* Product Images (multiple allowed; combined output when 2+) */}
                            <div>
                                <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-[#7753ff]" />
                                    {t("images.productImage")}<span className="text-red-500 ml-1">*</span>
                                    <span className="text-sm font-normal text-[#737373]">(1–{MAX_PRODUCT_IMAGES} images; multiple = one combined result)</span>
                                </label>
                                {uploadErrors.productImages && (
                                    <p className="mb-2 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {uploadErrors.productImages}
                                    </p>
                                )}
                                <div
                                    className={`border-2 border-dashed rounded-2xl p-6 transition-all duration-300 cursor-pointer ${
                                        uploadErrors?.productImages
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
                                        multiple
                                        onChange={(e) =>
                                            handleFileChange(
                                                "productImages",
                                                e.target.files ? Array.from(e.target.files) : [],
                                                e.target
                                            )
                                        }
                                    />
                                    {productPreviews.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {productPreviews.map((preview, idx) => (
                                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-[#e6e6e6]">
                                                        <Image src={preview} alt={`Product ${idx + 1}`} fill className="object-contain" />
                                                        <button
                                                            type="button"
                                                            onClick={(ev) => removeProductImage(ev, idx)}
                                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                        <span className="absolute bottom-1 left-1 text-xs font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
                                                            {idx + 1}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[#737373] text-sm">
                                                {productPreviews.length} image(s). {productPreviews.length >= 2 ? "Result will be one combined image with new background." : "Add more or generate."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="w-12 h-12 text-[#7753ff] mx-auto mb-3" />
                                            <p className="text-[#1a1a1a] font-medium mb-1">{t("images.uploadProductImage")}</p>
                                            <p className="text-[#737373] text-sm">{t("images.pngJpgUpTo10MB")}</p>
                                            <p className="text-[#737373] text-xs mt-1">Upload multiple for one combined themed image</p>
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
                                            <button
                                                type="button"
                                                onClick={removeReferenceImage}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                            >
                                                <X size={14} />
                                            </button>
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

                            {/* Number of variations (only when single product image) */}
                            {(formData.productImages?.length || 0) <= 1 && (
                                <div>
                                    <label className="block text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                                        <MdPhotoSizeSelectLarge size={20} className="text-[#7753ff]" />
                                        {t("images.numberOfImages") || "Number of images"}
                                    </label>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <NumberOfImagesSelector
                                            value={numImages}
                                            onChange={setNumImages}
                                            min={MIN_IMAGES}
                                            max={MAX_IMAGES}
                                            primaryColor="#7753ff"
                                        />
                                    </div>
                                </div>
                            )}
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
                                <div ref={generateSectionRef} className="flex flex-col items-end gap-2">
                                    {showCostNote && (formData.productImages?.length || 0) <= 1 && numImages > 1 && (
                                        <div className="flex items-center gap-2 px-4 py-3 
bg-gray-100/80 
border border-gray-200 
rounded-xl 
text-gray-800 text-sm">

                                            <Coins className="w-5 h-5 text-amber-600 shrink-0" />
                                            <span>{t("images.creditsCost") || "Cost:"} {numImages * (creditSettings.credits_per_image_generation || 2)} {t("images.credits") || "credits"}. {t("images.clickGenerateAgainToConfirm") || "Click Generate again to confirm."}</span>
                                        </div>
                                    )}
                                    <button
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
                                                {t("images.generateImage")}
                                            </>
                                        )}
                                    </button>
                                </div>
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
                                        <div className="flex flex-col gap-6">
                                            {result.images.map((img, idx) => (
                                                <div key={img.mongo_id || idx} className="rounded-xl border-2 border-[#7753ff]/20 overflow-hidden bg-gray-50 relative">
                                                    <div className="relative w-full h-[400px]">
                                                        <Image src={img.generated_image_url} alt={`Generated ${idx + 1}`} fill className="object-contain" />
                                                    </div>
                                                    <div className="p-4 flex flex-wrap gap-3 justify-center border-t border-[#7753ff]/10">
                                                        <span className="text-sm font-medium text-[#7753ff] bg-white/90 px-2 py-1 rounded border border-[#7753ff]/20">Image {idx + 1}</span>
                                                        <button type="button" onClick={() => handleView(img)} className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 flex items-center gap-2"><Eye size={16} />{t("images.view")}</button>
                                                        <button type="button" onClick={() => downloadImage(img.generated_image_url, `themed-${idx + 1}.png`)} className="px-4 py-3 bg-[#7753ff] text-white rounded-xl font-semibold flex items-center gap-2"><Download size={16} />{t("images.download")}</button>
                                                        <button type="button" onClick={() => handleRegenerate({ ...img, index: idx })} className="px-4 py-3 border-2 border-[#7753ff] text-[#7753ff] rounded-xl font-semibold hover:bg-[#7753ff]/10 flex items-center gap-2"><RefreshCw size={16} />{t("images.regenerate")}</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => { setResult(null); setFormData({ productImages: [], referenceImage: null, backgroundColor: "#ffffff", prompt: "", dimension: "1:1" }); setProductPreviews([]); setReferencePreview(null); setReferenceAnalysis(""); }} className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">{t("images.newImage")}</button>
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
                                                <button onClick={() => handleView(result)} className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"><Eye size={16} />{t("images.view")}</button>
                                                <button onClick={() => downloadImage(result.generated_image_url, "themed-image.png")} className="px-4 py-3 bg-gradient-to-r from-[#884cff] to-[#5a2fcf] text-white rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"><Download size={16} />{t("images.download")}</button>
                                                <button onClick={handleRegenerate} className="px-4 py-3 border-2 border-[#7753ff] text-[#7753ff] rounded-xl font-semibold hover:bg-[#7753ff]/10 transition-all flex items-center justify-center gap-2"><RefreshCw size={18} />{t("images.regenerate")}</button>
                                            </div>
                                            <button onClick={() => { setResult(null); setFormData({ productImages: [], referenceImage: null, backgroundColor: "#ffffff", prompt: "", dimension: "1:1" }); setProductPreviews([]); setReferencePreview(null); setReferenceAnalysis(""); }} className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">{t("images.newImage")}</button>
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
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex-shrink-0 border-b border-gray-200 bg-white p-6 rounded-t-3xl z-10 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
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

                        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
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
                                    <p className="text-red-700 text-sm">{regenerateModal.error}</p>
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
                                    disabled={regenerateModal.loading}
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


}

export default BackgroundReplaceForm
