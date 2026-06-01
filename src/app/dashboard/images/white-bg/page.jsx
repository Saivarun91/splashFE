"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Zap, Upload, Palette, Sparkles, Loader2, CheckCircle, AlertCircle, RefreshCw, X, Download, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiService } from "@/lib/api"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { useLanguage } from "@/context/LanguageContext"
import toast from "react-hot-toast"
import { DimensionsSelector } from "@/components/images/DimensionsSelector"
import { openImageViewer } from "@/lib/openImageViewer"
import { MdPhotoSizeSelectLarge } from "react-icons/md"
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const PlainBackgroundForm = () => {
    const router = useRouter()
    const { t } = useLanguage()
    const [uploadError, setUploadError] = useState(null);

    const [formData, setFormData] = useState({
        image: null,
        prompt: "",
        backgroundColor: "#ffffff",
        dimension: "1:1",
    })
    const [imagePreview, setImagePreview] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const { token } = useAuth()
    const [regenerateModal, setRegenerateModal] = useState({
        isOpen: false,
        prompt: '',
        loading: false,
        error: null
    })
    // const handleFileChange = (file) => {
    //     if (file) {
    //         setFormData((prev) => ({ ...prev, image: file }))
    //         const reader = new FileReader()
    //         reader.onloadend = () => {
    //             setImagePreview(reader.result)
    //         }
    //         reader.readAsDataURL(file)
    //     }
    // }

    const handleFileChange = (file, inputEl) => {
        if (!file) return;
      
        // clear previous error
        setUploadError(null);
      
        // ❌ size validation
        if (file.size > MAX_IMAGE_BYTES) {
          setUploadError("File size exceeded. Maximum allowed size is 10MB.");
          inputEl.value = ""; // 🔥 critical for reselect
          return;
        }
      
        // ❌ type validation
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          setUploadError("Only PNG, JPG, or WEBP images are allowed.");
          inputEl.value = "";
          return;
        }
      
        // ✅ valid file
        setFormData((prev) => ({ ...prev, image: file }));
      
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      };
      
    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith("image/")) {
            handleFileChange(file)
        }
    }

    const handleView = (selectedImage = null) => {
        const generatedImages =
            result?.generated_image_url
                ? [result]
                : []

        const viewerItems = generatedImages.map((img, idx) => ({
            url: img.generated_image_url,
            label: `Image ${idx + 1}`
        }))

        const activeIndex = selectedImage ? 0 : 0
        openImageViewer(viewerItems, activeIndex)
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


    const handleRegenerate = () => {
        setRegenerateModal({
            isOpen: true,
            prompt: '',
            loading: false,
            error: null
        })
    }

    const submitRegenerate = async () => {
        if (!regenerateModal.prompt.trim()) {
            setRegenerateModal(prev => ({
                ...prev,
                error: 'Please enter a prompt for regeneration'
            }))
            return
        }

        setRegenerateModal(prev => ({ ...prev, loading: true, error: null }))

        try {
            if (!result?.mongo_id) {
                throw new Error('Cannot regenerate: MongoDB ID is missing. Please generate a new image first.')
            }

            const response = await apiService.regenerateImage(
                result.mongo_id,
                regenerateModal.prompt,
                token
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
                toast.success('Image regenerated successfully!')
            } else {
                throw new Error(response.error || 'Regeneration failed')
            }
        } catch (error) {
            console.error("Error regenerating image:", error)
            setRegenerateModal(prev => ({
                ...prev,
                loading: false,
                error: error.response?.data?.error || error.message || 'Failed to regenerate image'
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

        if (!formData.image) {
            setError(t("images.pleaseUploadImage"))
            return
        }

        setIsLoading(true)

        try {
            const formDataToSend = new FormData()

            formDataToSend.append("image", formData.image)
            formDataToSend.append("prompt", formData.prompt)
            formDataToSend.append("background_color", formData.backgroundColor)
            formDataToSend.append("dimension", formData.dimension)
            console.log("FormData to send:");
            for (let [key, value] of formDataToSend.entries()) {
                console.log(key, value);
            }

            const response = await apiService.uploadOrnamentWithBackground(formDataToSend, token)
            console.log(response.data)

            if (response.success) {
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
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-12">
                    <div className="p-3 bg-gold-gradient rounded-2xl shadow-lg">
                        <MdPhotoSizeSelectLarge className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-foreground">
                            {t("images.plainBackground")}
                        </h1>
                        <p className="text-muted-foreground mt-2">{t("images.cleanProductShots")}</p>
                    </div>
                </div>

                {/* Form and Result Container */}
                <div className={`grid grid-cols-1 gap-8 transition-all duration-500 ${result ? 'lg:grid-cols-[4fr_6fr]' : 'lg:grid-cols-[7fr_3fr]'}`}>
                    {/* Form */}
                    <div className="space-y-8 bg-card rounded-xl p-8 border border-border">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Product Image Upload */}
                            <div>
                                <label className="block text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <Upload size={20} className="text-gold-solid" />
                                    {t("images.productImage")}<span className="text-red-500 ml-1">*</span>
                                    {uploadError && (
  <p className="mt-3 text-sm text-red-600 flex items-center gap-2">
    <AlertCircle className="w-4 h-4" />
    {uploadError}
  </p>
)}

                                </label>
                                <div
  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
    uploadError
      ? "border-red-500 bg-red-500/10"
      : isDragging
      ? "border-gold-muted bg-gold-solid/5"
      : "border-border hover:border-gold-muted hover:bg-gold-solid/5"
  }`}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  onClick={() => document.getElementById("file-input")?.click()}
>

                                    <input
                                        id="file-input"
                                        name="image" // <-- add this
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) =>
                                            handleFileChange(e.target.files?.[0] || null, e.target)
                                          }
                                          
                                    />

                                    {imagePreview ? (
                                        <div className="relative w-full h-48">
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                fill
                                                className="object-contain rounded-lg"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 text-gold-solid mx-auto mb-4" />
                                            <p className="text-foreground font-medium mb-2">{t("images.dragDropProduct")}</p>
                                            <p className="text-muted-foreground text-sm">{t("images.clickToBrowse")}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Prompt */}
                            <div>
                                <label className="block text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <Sparkles size={20} className="text-gold-solid" />
                                    {t("images.descriptionPrompt")} <span className="text-muted-foreground text-sm font-normal">({t("common.optional")})</span>
                                </label>
                                <Input
                                    type="text"
                                    // placeholder={t("images.removeBackgroundPlaceholder")}
                                    value={formData.prompt}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                                    className="w-full px-4 py-3 border border-border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            {/* Dimensions */}
                            <DimensionsSelector
                                selectedDimension={formData.dimension}
                                onDimensionChange={(dimension) => setFormData((prev) => ({ ...prev, dimension }))}
                                
                            />

                            {/* Background Color */}
                            {/* <div>
                                <label className="block text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gold-gradient"></div>
                                    Background Color
                                </label>
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#f8f7ff] to-[#f5f3ff] rounded-2xl border border-border">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={formData.backgroundColor}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    backgroundColor: e.target.value,
                                                }))
                                            }
                                            className="w-16 h-16 rounded-2xl cursor-pointer border-2 border-white shadow-lg"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={formData.backgroundColor}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    backgroundColor: e.target.value,
                                                }))
                                            }
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-input text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div> */}

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex items-center justify-between pt-8 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="flex items-center gap-3 px-6 py-3 text-gold-solid font-semibold hover:bg-accent rounded-xl transition-all duration-300"
                                >
                                    <ChevronLeft size={20} />
                                    {t("common.back")}
                                </button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    variant="brand"
                                    className="flex items-center gap-3 px-8 py-4 h-auto rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            {t("images.generating")}
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={20} />
                                            {t("images.generateImage")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Result Preview */}
                    <div className="bg-card rounded-xl p-8 border border-border">
                        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-gold-solid" />
                            {t("images.resultPreview")}
                        </h3>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-center">
                                <Loader2 className="w-16 h-16 text-gold-solid animate-spin mb-4" />
                                <p className="text-muted-foreground text-lg">{t("images.generatingYourImage")}</p>
                                <p className="text-muted-foreground text-sm mt-2">{t("images.mayTakeFewMoments")}</p>
                            </div>
                        ) : result ? (
                            <div className="space-y-6">
                                <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border-2 border-gold-muted/20">
                                    <Image
                                        src={result.generated_image_url}
                                        alt="Generated"
                                        fill
                                        className="object-contain bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                                        <p className="text-green-400 font-semibold">✓ {t("images.imageGeneratedSuccess")}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleView(result)}
                                            className="px-4 py-3 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-secondary/30 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Eye size={16} />
                                            {t("images.view")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => downloadImage(result.generated_image_url, "generated-image.png")}
                                            className="px-4 py-3 bg-gold-gradient text-white rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Download size={16} />
                                            {t("images.download")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRegenerate}
                                            className="px-4 py-3 border-2 border-gold-muted text-gold-solid rounded-xl font-semibold hover:bg-[#f0e6ff] transition-all flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={16} />
                                            {t("images.regenerate")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setResult(null)
                                                setFormData({ image: null, prompt: "", backgroundColor: "#ffffff", dimension: "1:1" })
                                                setImagePreview(null)
                                            }}
                                            className="px-4 py-3 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-secondary/30 transition-all"
                                        >
                                            {t("images.newImage")}
                                        </button>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <p className="text-blue-700 text-sm flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            {t("images.clickRegenerateToModify")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[400px] text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-gold-from/10 to-gold-to/10 rounded-full flex items-center justify-center mb-4">
                                    <Sparkles className="w-12 h-12 text-gold-solid" />
                                </div>
                                <p className="text-muted-foreground text-lg">{t("images.generatedImageWillAppear")}</p>
                                <p className="text-muted-foreground text-sm mt-2">{t("images.uploadAndClickGenerate")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Regenerate Modal */}
            {regenerateModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex-shrink-0 border-b border-border bg-card p-6 rounded-t-xl z-10 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gold-gradient rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{t("images.regenerateImage")}</h2>
                                        <p className="text-sm text-muted-foreground">{t("images.modifyAndRegenerate")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeRegenerateModal}
                                    disabled={regenerateModal.loading}
                                    className="p-2 hover:bg-accent rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <X className="w-6 h-6 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
                            {/* Current Image */}
                            <div>
                                <p className="text-sm font-semibold text-foreground mb-3">Current Image:</p>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-border">
                                    <Image
                                        src={result?.generated_image_url}
                                        alt="Current image"
                                        fill
                                        className="object-contain bg-secondary/30"
                                    />
                                </div>
                            </div>

                            {/* Original Prompt
                            {result.prompt && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-900 mb-2">Original Prompt:</p>
                                    <p className="text-sm text-blue-700">{result.prompt}</p>
                                </div>
                            )} */}

                            {/* New Prompt Input */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-gold-solid" />
                                    What would you like to change?
                                </label>
                                <textarea
                                    value={regenerateModal.prompt}
                                    onChange={(e) => setRegenerateModal(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder="E.g., 'Add more sparkle and brightness', 'Make it more vibrant', 'Add gold accents'..."
                                    className="w-full px-4 py-3 border border-border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                                    rows="4"
                                    disabled={regenerateModal.loading}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    💡 Your modification will be applied to regenerate the image
                                </p>
                            </div>

                            {/* Error Message */}
                            {regenerateModal.error && (
                                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-400 text-sm"> Oops! Something went wrong. Please try again.</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-border">
                                <button
                                    onClick={closeRegenerateModal}
                                    disabled={regenerateModal.loading}
                                    className="flex-1 px-6 py-3 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-secondary/30 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitRegenerate}
                                    disabled={regenerateModal.loading || !regenerateModal.prompt.trim()}
                                    className="flex-1 px-6 py-3 bg-gold-gradient text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {regenerateModal.loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Regenerating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5" />
                                            Regenerate Image
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Loading Info */}
                            {regenerateModal.loading && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-yellow-800 text-sm text-center">
                                        ⏱️ This may take 10-30 seconds. Please wait...
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

export default PlainBackgroundForm
