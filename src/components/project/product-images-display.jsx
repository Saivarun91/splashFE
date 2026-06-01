
"use client"

import { useState, useEffect } from "react"
import { Download, ExternalLink, RefreshCw, X, Sparkles, Image as ImageIcon, MessageCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { formatRelativeCommentTime } from "@/lib/comment-time"

export function ProductImagesDisplay({
    project,
    collectionData,
    showRegenerate = false,
    onRegenerateSuccess,
    canEdit = true
}) {
    const [regenerating, setRegenerating] = useState(null)
    const [showPromptModal, setShowPromptModal] = useState(null)
    const [customPrompt, setCustomPrompt] = useState("")
    const [error, setError] = useState(null)
    const [currentVersionMap, setCurrentVersionMap] = useState({})
    const [zoomedImage, setZoomedImage] = useState(null)
    const [useDifferentModel, setUseDifferentModel] = useState(false)
    const [selectedModel, setSelectedModel] = useState(null)
    const [availableModels, setAvailableModels] = useState({ ai_models: [], real_models: [] })
    const [activeCommentField, setActiveCommentField] = useState(null)
    const [commentsByField, setCommentsByField] = useState({
        generated_product_images: [],
    })
    const [draftComment, setDraftComment] = useState("")
    const [replyDraftByCommentId, setReplyDraftByCommentId] = useState({})
    const [replyingToCommentId, setReplyingToCommentId] = useState(null)
    const [commentError, setCommentError] = useState("")
    const [commentMessage, setCommentMessage] = useState("")
    const [savingComments, setSavingComments] = useState(false)
    const [nowMs, setNowMs] = useState(Date.now())
    const { token } = useAuth()
    const commentFieldConfig = {
        generated_product_images: {
            payloadKey: "generated_product_images_comments",
            title: "Generated Product Images",
        },
    }
    const activeCommentConfig = activeCommentField ? commentFieldConfig[activeCommentField] : null
    const currentComments = activeCommentField ? (commentsByField[activeCommentField] || []) : []

    useEffect(() => {
        setCommentsByField({
            generated_product_images: Array.isArray(collectionData?.generated_product_images_comments) ? collectionData.generated_product_images_comments : [],
        })
    }, [collectionData?.generated_product_images_comments])

    const loadCommentsFromDb = async () => {
        if (!collectionData?.id || !token) return
        try {
            const latestCollection = await apiService.getCollection(collectionData.id, token, {
                cache: "no-store",
            })
            setCommentsByField({
                generated_product_images: Array.isArray(latestCollection?.generated_product_images_comments)
                    ? latestCollection.generated_product_images_comments
                    : [],
            })
        } catch (error) {
            // Keep existing comments in UI if refresh fails.
        }
    }

    useEffect(() => {
        if (!activeCommentField) return
        loadCommentsFromDb()
        const intervalId = setInterval(() => {
            loadCommentsFromDb()
        }, 5000)
        return () => clearInterval(intervalId)
    }, [activeCommentField, collectionData?.id, token])

    useEffect(() => {
        if (!activeCommentField) return
        setNowMs(Date.now())
        const timerId = setInterval(() => {
            setNowMs(Date.now())
        }, 60000)
        return () => clearInterval(timerId)
    }, [activeCommentField])

    const persistComments = async (commentType, nextComments, successText = "Comments saved successfully.") => {
        if (!commentType || !project?.id || !collectionData?.id) {
            setCommentError("Unable to save comments for this project.")
            return false
        }

        setSavingComments(true)
        setCommentError("")
        setCommentMessage("")
        try {
            const response = await apiService.updateSelectionComments(
                project.id,
                collectionData.id,
                commentType,
                nextComments,
                token
            )
            if (!response?.success) {
                throw new Error(response?.error || "Failed to save comments")
            }

            const responseKey = commentFieldConfig[commentType]?.payloadKey
            const responseComments = responseKey && Array.isArray(response?.[responseKey]) ? response[responseKey] : []
            setCommentsByField((prev) => ({
                ...prev,
                [commentType]: responseComments,
            }))
            setCommentMessage(successText)
            return true
        } catch (error) {
            setCommentError(error?.message || "Failed to save comments")
            return false
        } finally {
            setSavingComments(false)
        }
    }

    const handleAddComment = async () => {
        const text = draftComment.trim()
        if (!text || !activeCommentField) return

        const newComment = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            comment: text,
            selection: "",
        }
        const nextComments = [...currentComments, newComment]
        setCommentsByField((prev) => ({
            ...prev,
            [activeCommentField]: nextComments,
        }))
        setDraftComment("")
        setCommentError("")
        setCommentMessage("")
        await persistComments(activeCommentField, nextComments, "Comment added.")
    }

    const handleDeleteComment = async (commentId) => {
        if (!activeCommentField) return

        const previousComments = currentComments
        const nextComments = currentComments.filter((comment) => comment.id !== commentId)
        setCommentsByField((prev) => ({
            ...prev,
            [activeCommentField]: nextComments,
        }))
        const deleted = await persistComments(activeCommentField, nextComments, "Comment deleted.")
        if (!deleted) {
            setCommentsByField((prev) => ({
                ...prev,
                [activeCommentField]: previousComments,
            }))
        }
    }

    const openComments = (fieldKey) => {
        setActiveCommentField(fieldKey)
        setDraftComment("")
        setCommentError("")
        setCommentMessage("")
    }

    const closeComments = () => {
        setActiveCommentField(null)
        setReplyDraftByCommentId({})
        setReplyingToCommentId(null)
    }

    const handleStartReply = (commentId) => {
        setReplyingToCommentId(commentId)
        setCommentError("")
        setCommentMessage("")
    }

    const handleReplyDraftChange = (commentId, value) => {
        setReplyDraftByCommentId((prev) => ({
            ...prev,
            [commentId]: value,
        }))
    }

    const handleAddReply = async (commentId) => {
        if (!activeCommentField) return
        const replyText = (replyDraftByCommentId[commentId] || "").trim()
        if (!replyText) return

        const nextComments = currentComments.map((comment) => {
            if (comment.id !== commentId) return comment
            const existingReplies = Array.isArray(comment.replies) ? comment.replies : []
            const newReply = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                comment: replyText,
                selection: "",
            }
            return {
                ...comment,
                replies: [...existingReplies, newReply],
            }
        })

        setCommentsByField((prev) => ({
            ...prev,
            [activeCommentField]: nextComments,
        }))
        setReplyDraftByCommentId((prev) => ({
            ...prev,
            [commentId]: "",
        }))
        setCommentError("")
        setCommentMessage("")
        const saved = await persistComments(activeCommentField, nextComments, "Reply added.")
        if (saved) {
            setReplyingToCommentId(null)
        }
    }

    const renderCommentButton = (fieldKey) => {
        const commentsCount = (commentsByField[fieldKey] || []).length
        const isActive = activeCommentField === fieldKey
        return (
            <button
                type="button"
                onClick={() => (isActive ? closeComments() : openComments(fieldKey))}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    commentsCount > 0
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gold-solid hover:bg-gold-solid/10"
                }`}
                aria-label="Open comments"
                title="Open comments"
            >
                <MessageCircle className="w-4 h-4" />
                {isActive ? "Hide comments" : "Comments"}
            </button>
        )
    }
    if (!collectionData?.items?.[0]?.product_images) {
        return (
            <div className="mb-12">
                <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-gray-50/50">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/70" />
                    </div>
                    <p className="text-muted-foreground mb-2 font-medium">No product images found</p>
                    <p className="text-sm text-muted-foreground">
                        Upload product images in Step 3 to get started
                    </p>
                </div>
            </div>
        )
    }

    const products = collectionData.items[0].product_images

    const handleRegenerate = async (product, generatedImage) => {
        // Validation: If using different model, just need model selection. Otherwise need prompt.
        if (useDifferentModel && !selectedModel) {
            setError("Please select a model for regeneration")
            return
        }

        if (!useDifferentModel && !customPrompt.trim()) {
            setError("Please enter a prompt for regeneration")
            return
        }

        const regKey = `${product.uploaded_image_path}_${generatedImage.local_path}`
        setRegenerating(regKey)
        setError(null)

        try {
            const response = await apiService.regenerateProductModelImage(
                collectionData.id,
                product.uploaded_image_path,
                generatedImage.local_path,
                customPrompt,
                useDifferentModel,
                selectedModel,
                token
            )

            if (response.success) {
                setShowPromptModal(null)
                setCustomPrompt("")
                setUseDifferentModel(false)
                setSelectedModel(null)
                if (onRegenerateSuccess) {
                    onRegenerateSuccess()
                }
            } else {
                setError(response.error || "Failed to regenerate image")
            }
        } catch (err) {
            console.error('Error regenerating image:', err)
            setError(err.message || "Failed to regenerate image")
        } finally {
            setRegenerating(null)
        }
    }

    const openPromptModal = async (product, generatedImage, isRegenerated = false) => {
        setShowPromptModal({ product, generatedImage, isRegenerated })
        // Show empty textarea - the backend will combine with original prompt
        setCustomPrompt("")
        setUseDifferentModel(false)
        setSelectedModel(null)
        setError(null)

        // Load available models
        try {
            const modelsData = await apiService.getAllModels(collectionData.id, token)
            if (modelsData.success) {
                setAvailableModels({
                    ai_models: modelsData.ai_models || [],
                    real_models: modelsData.real_models || []
                })
            }
        } catch (err) {
            console.error('Error loading models:', err)
        }
    }

    const handleEnhance = async (product, generatedImage) => {
        console.log("Enhancing image:", generatedImage.cloud_url)
        setError(null)

        try {
            const response = await apiService.enhanceImage(
                generatedImage.cloud_url,
                collectionData.id,
                product.uploaded_image_path,
                generatedImage.local_path,
                token
            )

            if (response.success) {
                // Refresh the collection data to show the enhanced image
                if (onRegenerateSuccess) {
                    onRegenerateSuccess()
                }
            } else {
                setError(response.error || "Failed to enhance image")
            }
        } catch (err) {
            console.error('Error enhancing image:', err)
            setError(err.message || "Failed to enhance image")
        }
    }

    const downloadImageAsBlob = async (imageUrl, filename) => {
        try {
            // Fetch the image as a blob
            const response = await fetch(imageUrl, {
                mode: 'cors',
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const blob = await response.blob();

            // Create a blob URL
            const blobUrl = window.URL.createObjectURL(blob);

            // Create a temporary link element
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            link.style.display = 'none';

            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();

            // Small delay before cleanup to ensure download starts
            setTimeout(() => {
                link.remove();
                window.URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            console.error('Error downloading image:', error);
            // Fallback: try direct download
            try {
                const link = document.createElement("a");
                link.href = imageUrl;
                link.download = filename;
                link.target = '_blank';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                setTimeout(() => link.remove(), 100);
            } catch (fallbackError) {
                console.error('Fallback download also failed:', fallbackError);
                // Last resort: open in new tab
                window.open(imageUrl, '_blank');
            }
        }
    };

    const handleDownloadImage = async (imageUrl, imageType, productIndex, imageIndex, versionType = '', versionIndex = null) => {
        // Generate filename
        const imageTypeLabel = imageType?.replace(/_/g, '-') || 'generated';
        let filename = `product-${productIndex}-${imageTypeLabel}-${imageIndex}`;

        if (versionType === 'regenerated' && versionIndex !== null) {
            filename += `-regenerated-v${versionIndex + 1}`;
        } else if (versionType === 'enhanced' && versionIndex !== null) {
            filename += `-enhanced-v${versionIndex + 1}`;
        }

        filename += '.png';

        await downloadImageAsBlob(imageUrl, filename);
    }

    return (
        <div className="mb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                        Generated Product Images
                    </h3>
                    <p className="text-muted-foreground">
                        {products.length} product{products.length !== 1 ? 's' : ''} • Preview and manage your AI-generated images
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {renderCommentButton("generated_product_images")}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gold-solid/10 border border-gold-muted rounded-full">
                        <Sparkles className="w-4 h-4 text-gold-solid" />
                        <span className="text-sm font-medium text-gold-solid">AI Generated</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                                <X className="w-3 h-3 text-red-600" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="space-y-8">
                {products.map((product, productIndex) => {
                    const hasGeneratedImages = product.generated_images && product.generated_images.length > 0

                    return (
                        <div key={productIndex} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                            {/* Product Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-gold-solid to-gold-solid/80 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-semibold text-sm">
                                            {productIndex + 1}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-foreground">
                                            Product {productIndex + 1}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {hasGeneratedImages
                                                ? `${product.generated_images.length} generated image${product.generated_images.length !== 1 ? 's' : ''}`
                                                : 'No images generated yet'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Image Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                {/* Original Product Image */}
                                <div className="md:col-span-1">
                                    <div className="space-y-3">
                                        <div className="relative group">
                                            <div className="aspect-square rounded-xl overflow-hidden bg-muted border-2 border-gold-solid shadow-sm">
                                                <img
                                                    src={product.uploaded_image_url}
                                                    alt={`Product ${productIndex + 1}`}
                                                    className="w-full h-full object-cover cursor-zoom-in transition-transform hover:scale-105"
                                                    onClick={() => setZoomedImage(product.uploaded_image_url)}
                                                />
                                            </div>
                                            <div className="absolute top-3 left-3 bg-gold-solid text-white text-xs px-2 py-1 rounded-full font-medium">
                                                Original
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center font-medium">
                                            Source Image
                                        </p>
                                    </div>
                                </div>

                                {/* Generated Images */}
                                {hasGeneratedImages ? (
                                    <div className="md:col-span-5">
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                            {product.generated_images.map((img, imgIndex) => {
                                                const regKey = `${product.uploaded_image_path}_${img.local_path}`
                                                const totalVersions = 1 + (img.regenerated_images?.length || 0) + (img.enhanced_images?.length || 0)
                                                const currentIndex = currentVersionMap[regKey] || 0

                                                // Determine which image to show based on current index
                                                let imageToShow = img
                                                let versionType = 'original'

                                                if (currentIndex > 0) {
                                                    const regeneratedCount = img.regenerated_images?.length || 0
                                                    if (currentIndex <= regeneratedCount) {
                                                        // Show regenerated image
                                                        imageToShow = img.regenerated_images[currentIndex - 1]
                                                        versionType = 'regenerated'
                                                    } else {
                                                        // Show enhanced image
                                                        const enhancedIndex = currentIndex - regeneratedCount - 1
                                                        imageToShow = img.enhanced_images[enhancedIndex]
                                                        versionType = 'enhanced'
                                                    }
                                                }

                                                const isRegenerating = regenerating === regKey

                                                return (
                                                    <div key={imgIndex} className="group">
                                                        <div className="space-y-3">
                                                            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border shadow-sm hover:shadow-md transition-all">
                                                                <img
                                                                    src={imageToShow.cloud_url}
                                                                    alt={`${imageToShow.type} ${imgIndex + 1}`}
                                                                    className="w-full h-full object-cover cursor-zoom-in transition-transform hover:scale-105"
                                                                    onClick={() => setZoomedImage(imageToShow.cloud_url)}
                                                                />

                                                                {/* Hover Overlay */}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                                                    {/* Top Badge */}
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full capitalize">
                                                                            {currentIndex === 0
                                                                                ? img.type?.replace("_", " ") || "Generated"
                                                                                : versionType === 'enhanced'
                                                                                    ? 'Enhanced'
                                                                                    : `v${currentIndex + 1}`
                                                                            }
                                                                        </div>
                                                                        {totalVersions > 1 && (
                                                                            <div className="flex gap-1 justify-center">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setCurrentVersionMap((prev) => ({
                                                                                            ...prev,
                                                                                            [regKey]: Math.max(0, currentIndex - 1),
                                                                                        }))
                                                                                    }}
                                                                                    disabled={currentIndex === 0}
                                                                                    className="flex-1 bg-card/90 text-muted-foreground text-xs p-1 rounded hover:bg-card transition-all disabled:opacity-40 font-medium"
                                                                                >
                                                                                    ←
                                                                                </button>
                                                                                {totalVersions > 1 && (
                                                                                    <div className="bg-card/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                                                                        {currentIndex + 1}/{totalVersions}
                                                                                    </div>
                                                                                )}
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setCurrentVersionMap((prev) => ({
                                                                                            ...prev,
                                                                                            [regKey]: Math.min(totalVersions - 1, currentIndex + 1),
                                                                                        }))
                                                                                    }}
                                                                                    disabled={currentIndex === totalVersions - 1}
                                                                                    className="flex-1 bg-card/90 text-muted-foreground text-xs p-1 rounded hover:bg-card transition-all disabled:opacity-40 font-medium"
                                                                                >
                                                                                    →
                                                                                </button>
                                                                            </div>
                                                                        )}

                                                                    </div>

                                                                    {/* Bottom Actions */}
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="flex gap-2 justify-center">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="secondary"
                                                                                className="gap-1 text-xs px-2 py-1 h-auto bg-card/90 backdrop-blur-sm hover:bg-card"
                                                                                onClick={() => window.open(imageToShow.cloud_url, "_blank")}
                                                                            >
                                                                                <ExternalLink className="w-3 h-3" /> View
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="secondary"
                                                                                className="gap-1 text-xs px-2 py-1 h-auto bg-card/90 backdrop-blur-sm hover:bg-card"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    // Calculate version index based on current view
                                                                                    let versionIndex = null;
                                                                                    if (currentIndex > 0) {
                                                                                        const regeneratedCount = img.regenerated_images?.length || 0;
                                                                                        if (currentIndex <= regeneratedCount) {
                                                                                            // Regenerated image
                                                                                            versionIndex = currentIndex - 1;
                                                                                        } else {
                                                                                            // Enhanced image
                                                                                            versionIndex = currentIndex - regeneratedCount - 1;
                                                                                        }
                                                                                    }
                                                                                    handleDownloadImage(
                                                                                        imageToShow.cloud_url,
                                                                                        img.type || imageToShow.type,
                                                                                        productIndex + 1,
                                                                                        imgIndex + 1,
                                                                                        versionType,
                                                                                        versionIndex
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Download className="w-3 h-3" /> Save
                                                                            </Button>
                                                                        </div>

                                                                        {showRegenerate && canEdit && (
                                                                            <div className="flex gap-2 justify-center">
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="bg-gold-solid hover:brightness-110 text-white gap-1 text-xs px-2 py-1 h-auto"
                                                                                    onClick={() => handleEnhance(product, imageToShow)}
                                                                                    disabled={isRegenerating}
                                                                                >
                                                                                    {/* <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} /> */}
                                                                                    {isRegenerating ? 'Processing...' : 'Enhance'}
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="bg-gold-solid hover:brightness-110 text-white gap-1 text-xs px-2 py-1 h-auto"
                                                                                    onClick={() => openPromptModal(product, imageToShow, currentIndex > 0)}
                                                                                    disabled={isRegenerating}
                                                                                >
                                                                                    {/* <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} /> */}
                                                                                    {isRegenerating ? 'Processing...' : 'regenerate'}
                                                                                </Button>

                                                                            </div>
                                                                        )}

                                                                        {/* Version Navigation */}

                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Image Label */}
                                                            <div className="text-center">
                                                                <p className={`text-xs font-medium ${currentIndex === 0
                                                                    ? "text-muted-foreground"
                                                                    : versionType === 'enhanced'
                                                                        ? "text-blue-600"
                                                                        : "text-green-600"
                                                                    }`}>
                                                                    {currentIndex === 0
                                                                        ? img.type?.replace("_", " ") || "Generated"
                                                                        : versionType === 'enhanced'
                                                                            ? 'Enhanced'
                                                                            : `Regenerated v${currentIndex}`
                                                                    }
                                                                </p>
                                                                {currentIndex > 0 && (
                                                                    <p className={`text-xs ${versionType === 'enhanced' ? 'text-blue-500' : 'text-green-500'}`}>
                                                                        ✓ {versionType === 'enhanced' ? 'Enhanced' : 'Improved'}
                                                                    </p>
                                                                )}

                                                                {/* Model Usage Information */}
                                                                {(() => {
                                                                    // Use Sets to track unique models by their URL/path
                                                                    const uniqueAIModels = new Set();
                                                                    const uniqueRealModels = new Set();

                                                                    // Add original model
                                                                    if (img.model_used?.type) {
                                                                        const modelIdentifier = img.model_used.cloud || img.model_used.local;
                                                                        if (modelIdentifier) {
                                                                            if (img.model_used.type === 'ai') {
                                                                                uniqueAIModels.add(modelIdentifier);
                                                                            } else if (img.model_used.type === 'real') {
                                                                                uniqueRealModels.add(modelIdentifier);
                                                                            }
                                                                        }
                                                                    }

                                                                    // Add regenerated models
                                                                    img.regenerated_images?.forEach(regen => {
                                                                        if (regen.model_used?.type) {
                                                                            const modelIdentifier = regen.model_used.cloud || regen.model_used.local;
                                                                            if (modelIdentifier) {
                                                                                if (regen.model_used.type === 'ai') {
                                                                                    uniqueAIModels.add(modelIdentifier);
                                                                                } else if (regen.model_used.type === 'real') {
                                                                                    uniqueRealModels.add(modelIdentifier);
                                                                                }
                                                                            }
                                                                        }
                                                                    });

                                                                    // Add enhanced models
                                                                    img.enhanced_images?.forEach(enhanced => {
                                                                        if (enhanced.model_used?.type) {
                                                                            const modelIdentifier = enhanced.model_used.cloud || enhanced.model_used.local;
                                                                            if (modelIdentifier) {
                                                                                if (enhanced.model_used.type === 'ai') {
                                                                                    uniqueAIModels.add(modelIdentifier);
                                                                                } else if (enhanced.model_used.type === 'real') {
                                                                                    uniqueRealModels.add(modelIdentifier);
                                                                                }
                                                                            }
                                                                        }
                                                                    });

                                                                    const aiCount = uniqueAIModels.size;
                                                                    const realCount = uniqueRealModels.size;
                                                                    const totalUniqueModels = aiCount + realCount;

                                                                    if (totalUniqueModels > 0) {
                                                                        return (
                                                                            <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {totalUniqueModels} {totalUniqueModels === 1 ? 'model' : 'models'}:
                                                                                </span>
                                                                                {aiCount > 0 && (
                                                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-gold-solid/15 text-gold-solid font-medium">
                                                                                        {aiCount} AI
                                                                                    </span>
                                                                                )}
                                                                                {realCount > 0 && (
                                                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600 font-medium">
                                                                                        {realCount} Real
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="md:col-span-5 flex items-center justify-center border-2 border-dashed border-border rounded-xl p-12 bg-gray-50/50">
                                        <div className="text-center">
                                            <ImageIcon className="w-12 h-12 text-muted-foreground/70 mx-auto mb-3" />
                                            <p className="text-muted-foreground font-medium mb-1">No generated images yet</p>
                                            <p className="text-sm text-muted-foreground">
                                                Generate images to see them appear here
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-7xl max-h-[90vh]">
                        <img
                            src={zoomedImage}
                            alt="Zoomed preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setZoomedImage(null)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Regenerate Prompt Modal */}
            {showPromptModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">
                                    Regenerate Image
                                </h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Use AI to improve your generated image
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPromptModal(null)
                                    setCustomPrompt("")
                                    setError(null)
                                }}
                                className="text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-blue-800 font-medium text-sm">
                                        How Regeneration works
                                    </p>
                                    <p className="text-blue-700 text-sm mt-1">
                                        The AI will use your original product image, the original style prompt, and your new modifications
                                        to create an improved version. Just describe what you want to change!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Original Prompt Display */}
                        {/* {showPromptModal.generatedImage.prompt && (
                            <div className="mb-6 p-4 bg-gold-solid/10 rounded-xl border border-gold-muted">
                                <p className="text-sm font-semibold text-foreground mb-2">📝 Original Style Prompt:</p>
                                <p className="text-sm text-gold-solid italic">{showPromptModal.generatedImage.prompt}</p>
                                <p className="text-xs text-gold-solid mt-2">
                                    ℹ️ This will be automatically considered along with your new modifications
                                </p>
                            </div>
                        )} */}

                        {/* Image Preview Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {/* Original Product */}
                            <div className="text-center">
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Original Product
                                </label>
                                <div className="border-2 border-gold-solid rounded-xl overflow-hidden shadow-sm">
                                    <img
                                        src={showPromptModal.product.uploaded_image_url}
                                        alt="Original Product"
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 font-medium">
                                    📦 Source Image
                                </p>
                            </div>

                            {/* Current Generated */}
                            {/* <div className="text-center">
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Current Version
                                </label>
                                <div className="border-2 border-green-500 rounded-xl overflow-hidden shadow-sm">
                                    <img
                                        src={showPromptModal.generatedImage.cloud_url}
                                        alt="Current Generated"
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 font-medium capitalize">
                                    🎨 {showPromptModal.generatedImage.type?.replace('_', ' ')}
                                </p>
                            </div> */}

                            {/* Result Indicator */}
                            <div className="flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-gold-solid to-gold-solid/80 rounded-full flex items-center justify-center mb-3 shadow-lg">
                                        <RefreshCw className="w-8 h-8 text-white" />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">
                                        New Enhanced Version
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Based on your instructions
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Current Model Information */}
                        {/* {showPromptModal.generatedImage.model_used && (
                            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-sm font-semibold text-blue-900 mb-2">📊 Current Model Information</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-700">Type:</span>{' '}
                                        <span className={`font-medium px-2 py-1 rounded ${showPromptModal.generatedImage.model_used.type === 'ai' ? 'bg-gold-solid/15 text-gold-solid' : 'bg-green-100 text-green-700'}`}>
                                            {showPromptModal.generatedImage.model_used.type === 'ai' ? 'AI Model' : 'Real Model'}
                                        </span>
                                    </div>
                                    {showPromptModal.generatedImage.model_used.name && (
                                        <div>
                                            <span className="text-blue-700">Name:</span>{' '}
                                            <span className="font-medium text-blue-900">{showPromptModal.generatedImage.model_used.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )} */}

                        {/* Model Selection Option */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    id="useDifferentModel"
                                    checked={useDifferentModel}
                                    onChange={(e) => {
                                        setUseDifferentModel(e.target.checked)
                                        if (!e.target.checked) setSelectedModel(null)
                                    }}
                                    className="w-4 h-4 text-gold-solid border-input rounded focus:ring-ring"
                                />
                                <label htmlFor="useDifferentModel" className="text-sm font-semibold text-foreground cursor-pointer">
                                    🔄 Try with a different model
                                </label>
                            </div>
                            {useDifferentModel && (
                                <p className="text-xs text-orange-600 mb-3 bg-orange-50 p-2 rounded">
                                    ℹ️ The prompt will be disabled and use the original generated prompt when using a different model
                                </p>
                            )}

                            {useDifferentModel && (
                                <div className="mt-3 space-y-3">
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Select a different model to regenerate this image:
                                    </p>

                                    {/* AI Models */}
                                    {availableModels.ai_models.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-2">AI Models</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {availableModels.ai_models.map((model, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedModel({ type: 'ai', ...model })}
                                                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedModel?.local === model.local
                                                            ? 'border-gold-solid ring-2 ring-gold-muted'
                                                            : 'border-border hover:border-gold-muted'
                                                            }`}
                                                    >
                                                        <img
                                                            src={model.cloud}
                                                            alt="AI Model"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {selectedModel?.local === model.local && (
                                                            <div className="absolute inset-0 bg-gold-solid/20 flex items-center justify-center">
                                                                <div className="bg-gold-solid text-white rounded-full p-1">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Real Models */}
                                    {availableModels.real_models.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-2">Real Models</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {availableModels.real_models.map((model, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedModel({ type: 'real', ...model })}
                                                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedModel?.local === model.local
                                                            ? 'border-green-500 ring-2 ring-green-300'
                                                            : 'border-border hover:border-green-300'
                                                            }`}
                                                    >
                                                        <img
                                                            src={model.cloud}
                                                            alt="Real Model"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {selectedModel?.local === model.local && (
                                                            <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center">
                                                                <div className="bg-green-600 text-white rounded-full p-1">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 text-center truncate">
                                                            {model.name || 'Model'}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!selectedModel && useDifferentModel && (
                                        <p className="text-xs text-orange-600 mt-2">
                                            ⚠️ Please select a model to use for regeneration
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Prompt Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                {useDifferentModel ? '📝 Using Original Prompt' : '✍️ Your Enhancement Instructions *'}
                            </label>
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                disabled={useDifferentModel}
                                className={`w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-h-[120px] resize-none text-foreground placeholder-gray-500 ${useDifferentModel ? 'bg-muted cursor-not-allowed' : ''}`}
                                placeholder={useDifferentModel ? "Using original prompt from generated image..." : "Describe what you want to improve... (e.g., Make the background more vibrant, add soft shadows, change the lighting to golden hour, improve contrast...)"}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                {useDifferentModel
                                    ? '🔒 Prompt is locked when using a different model. The original prompt will be used automatically.'
                                    : '💬 Be specific about what you want to change or improve in the image'
                                }
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <X className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-red-700 text-sm font-medium">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Example Prompts - Only show when not using different model */}
                        {!useDifferentModel && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-border">
                                <p className="text-xs font-semibold text-foreground mb-3">💡 Quick Enhancement Ideas:</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Make colors more vibrant and saturated",
                                        "Add soft shadows and depth",
                                        "Change lighting to golden sunset",
                                        "Make background more blurred",
                                        "Add more contrast and sharpness",
                                        "Create a more elegant atmosphere",
                                        "Make it look more professional"
                                    ].map((example, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCustomPrompt(example)}
                                            className="text-xs px-3 py-2 bg-card border border-input rounded-lg hover:border-gold-solid hover:text-gold-solid transition-colors font-medium"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowPromptModal(null)
                                    setCustomPrompt("")
                                    setError(null)
                                }}
                                className="px-6"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-gold-solid hover:brightness-110 text-white px-6"
                                onClick={() => handleRegenerate(showPromptModal.product, showPromptModal.generatedImage)}
                                disabled={
                                    regenerating ||
                                    (useDifferentModel ? !selectedModel : !customPrompt.trim())
                                }
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {regenerating ? 'Enhancing...' : (useDifferentModel ? 'Generate with New Model' : 'Enhance Image')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {activeCommentField && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-card rounded-xl shadow-2xl border border-border">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <h4 className="text-sm font-semibold text-foreground">{activeCommentConfig?.title} Comments</h4>
                            <button
                                type="button"
                                onClick={closeComments}
                                className="p-1 rounded hover:bg-muted"
                                aria-label="Close comments"
                            >
                                <X className="w-4 h-4 text-[#666]" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {currentComments.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No comments yet.</p>
                                ) : (
                                    currentComments.map((comment) => (
                                        <div key={comment.id} className="border border-border rounded-md p-2 bg-muted">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-[#444]">
                                                        {(comment.authorName || "Member")} • {formatRelativeCommentTime(comment.createdAt, nowMs)}
                                                    </p>
                                                    <p className="text-sm text-foreground break-words">{comment.comment}</p>
                                                    {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                                                        <div className="mt-2 pl-3 border-l border-border space-y-2">
                                                            {comment.replies.map((reply) => (
                                                                <div key={reply.id} className="bg-card border border-[#f0f0f0] rounded p-2">
                                                                    <p className="text-xs font-medium text-[#555]">
                                                                        {(reply.authorName || "Member")} • {formatRelativeCommentTime(reply.createdAt, nowMs)}
                                                                    </p>
                                                                    <p className="text-sm text-foreground break-words">{reply.comment}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {canEdit && (
                                                        <div className="mt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStartReply(comment.id)}
                                                                className="text-xs text-gold-solid hover:text-[#7a3ff0]"
                                                            >
                                                                {replyingToCommentId === comment.id ? "Replying..." : "Reply"}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {canEdit && replyingToCommentId === comment.id && (
                                                        <div className="mt-2 space-y-2">
                                                            <textarea
                                                                value={replyDraftByCommentId[comment.id] || ""}
                                                                onChange={(e) => handleReplyDraftChange(comment.id, e.target.value)}
                                                                placeholder="Write a reply..."
                                                                className="w-full h-16 px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                                                            />
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setReplyingToCommentId(null)}
                                                                    className="px-2 py-1 text-xs rounded-md border border-[#dcdcdc] text-[#555] hover:bg-gray-50"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddReply(comment.id)}
                                                                    disabled={savingComments || !(replyDraftByCommentId[comment.id] || "").trim()}
                                                                    className="px-2 py-1 text-xs rounded-md bg-gold-gradient text-white hover:brightness-110 disabled:opacity-60"
                                                                >
                                                                    {savingComments ? "Submitting..." : "Submit reply"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {canEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-red-500 hover:text-red-600 p-1"
                                                        aria-label="Delete comment"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {canEdit && (
                                <>
                                    <textarea
                                        value={draftComment}
                                        onChange={(e) => setDraftComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="w-full h-20 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                                    />

                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAddComment}
                                            disabled={savingComments || !draftComment.trim()}
                                            className="px-3 py-1.5 text-sm rounded-md bg-gold-gradient text-white hover:brightness-110 disabled:opacity-60"
                                        >
                                            {savingComments ? "Submitting..." : "Submit"}
                                        </button>
                                    </div>
                                </>
                            )}

                            {commentError && <p className="text-xs text-red-600">{commentError}</p>}
                            {commentMessage && <p className="text-xs text-green-600">{commentMessage}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
