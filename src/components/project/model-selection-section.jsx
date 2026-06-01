"use client"

import { useState, useEffect, useRef } from "react"
import { Users, Sparkles, CheckCircle, Upload, Image as ImageIcon, X, Eye, MessageCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { formatRelativeCommentTime } from "@/lib/comment-time"
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_REAL_MODEL_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
];

export function ModelSelectionSection({ project, collectionData, onSave, canEdit = true, onModelSelectionChange }) {
    const [activeTab, setActiveTab] = useState("ai") // 'ai' or 'real'
    const { token } = useAuth()
    // AI Models State
    const [realUploadError, setRealUploadError] = useState(null);

    const [aiModels, setAiModels] = useState([])
    const [generatedModels, setGeneratedModels] = useState([])
    const [generating, setGenerating] = useState(false)

    // Real Models State
    const [realModels, setRealModels] = useState([])
    const [uploadingReal, setUploadingReal] = useState(false)

    // Common State
    const [selectedModel, setSelectedModel] = useState(null)
    console.log(`DEBUG: selectedModel: ${selectedModel}`)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [activeCommentField, setActiveCommentField] = useState(null)
    const [commentsByField, setCommentsByField] = useState({
        human_model_preview: [],
        ai_model_preview: [],
    })
    const [draftComment, setDraftComment] = useState("")
    const [replyDraftByCommentId, setReplyDraftByCommentId] = useState({})
    const [replyingToCommentId, setReplyingToCommentId] = useState(null)
    const [commentError, setCommentError] = useState("")
    const [commentMessage, setCommentMessage] = useState("")
    const [savingComments, setSavingComments] = useState(false)
    const [nowMs, setNowMs] = useState(Date.now())

    const commentFieldConfig = {
        human_model_preview: {
            payloadKey: "human_model_preview_comments",
            title: "Human Model Preview",
        },
        ai_model_preview: {
            payloadKey: "ai_model_preview_comments",
            title: "AI Model Preview",
        },
    }

    const activeCommentConfig = activeCommentField ? commentFieldConfig[activeCommentField] : null
    const currentComments = activeCommentField ? (commentsByField[activeCommentField] || []) : []

    // Load existing models from collection data
    useEffect(() => {
        loadAllModels()
    }, [collectionData])

    useEffect(() => {
        setCommentsByField({
            human_model_preview: Array.isArray(collectionData?.human_model_preview_comments) ? collectionData.human_model_preview_comments : [],
            ai_model_preview: Array.isArray(collectionData?.ai_model_preview_comments) ? collectionData.ai_model_preview_comments : [],
        })
    }, [collectionData?.human_model_preview_comments, collectionData?.ai_model_preview_comments])

    const loadCommentsFromDb = async () => {
        if (!collectionData?.id || !token) return
        try {
            const latestCollection = await apiService.getCollection(collectionData.id, token, {
                cache: "no-store",
            })
            setCommentsByField({
                human_model_preview: Array.isArray(latestCollection?.human_model_preview_comments) ? latestCollection.human_model_preview_comments : [],
                ai_model_preview: Array.isArray(latestCollection?.ai_model_preview_comments) ? latestCollection.ai_model_preview_comments : [],
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
                onClick={(e) => {
                    e.stopPropagation()
                    isActive ? closeComments() : openComments(fieldKey)
                }}
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
    const handleDeleteModel = async (model, type) => {
        if (!window.confirm("Are you sure you want to delete this model?")) return

        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await apiService.removeModel(collectionData.id, type, model, token)
            if (response.success) {
                await loadAllModels()
                setSuccess("Model deleted successfully!")
            } else {
                setError(response.error || "Failed to delete model.")
            }
        } catch (err) {
            console.error("Error deleting model:", err)
            setError(err.message || "Failed to delete model.")
        } finally {
            setLoading(false)
        }
    }

    const loadAllModels = async () => {
        if (!collectionData?.id) return

        try {
            const response = await apiService.getAllModels(collectionData.id, token)

            if (response.success) {
                setAiModels(response.ai_models || [])
                setRealModels(response.real_models || [])

                // Set selected model if exists
                if (response.selected_model) {
                    // 🧠 Only set selectedModel if none currently chosen
                    // prevents overwriting user's immediate selection
                    setSelectedModel(prev => {
                        if (!prev) {
                            // Notify parent about the loaded model
                            if (onModelSelectionChange) {
                                onModelSelectionChange(response.selected_model)
                            }
                            return response.selected_model
                        }
                        return prev
                    })

                    if (response.selected_model.type === 'real') {
                        setActiveTab('real')
                    }
                }

            }
        } catch (err) {
            console.error('Error loading models:', err)
        }
    }

    const handleGenerateAIModels = async () => {
        if (!collectionData?.id) {
            setError('No collection found')
            return
        }

        setGenerating(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await apiService.generateAIImages(collectionData.id,token)

            if (response.images && response.images.length > 0) {
                // Add newly generated models to the list
                setGeneratedModels(response.images)
                setSuccess(`Generated ${response.images.length} new AI models! Select which ones to keep along with your existing models.`)
            } else {
                setError('No images were generated')
            }
        } catch (err) {
            console.error('Error generating models:', err)
            setError(err.message || 'Failed to generate models')
        } finally {
            setGenerating(false)
        }
    }

    const handleSaveAIModels = async (selectedImages) => {
        if (selectedImages.length === 0) {
            setError('Please select at least one model to save')
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await apiService.saveGeneratedImages(
                collectionData.id,
                selectedImages,
                token
            )

            if (response && response.success) {
                // Reload all models to get the updated list
                await loadAllModels()
                setGeneratedModels([])
                setSuccess('AI models saved successfully!')
                return true // Return true to indicate success
            } else {
                // Handle case where response.success is false
                const errorMsg = response?.error || 'Failed to save models. Please try again.'
                setError(errorMsg)
                console.error('Save failed:', response)
                return false // Return false to indicate failure
            }
        } catch (err) {
            console.error('Error saving models:', err)
            setError(err.message || 'Failed to save models')
            return false // Return false to indicate failure
        } finally {
            setLoading(false)
        }
    }

    const handleUploadRealModels = async (event) => {
        const files = Array.from(event.target.files);
        setRealUploadError(null);
      
        if (!files.length) return;
      
        for (const file of files) {
          if (file.size > MAX_IMAGE_BYTES) {
            setRealUploadError("File size exceeded. Max 10MB allowed per image.");
            event.target.value = "";
            return;
          }
      
          if (!ALLOWED_REAL_MODEL_TYPES.includes(file.type)) {
            setRealUploadError("Only JPG, PNG, WEBP or HEIC images are allowed.");
            event.target.value = "";
            return;
          }
        }
      
        setUploadingReal(true);
        setError(null);
        setSuccess(null);
      
        try {
          const response = await apiService.uploadRealModels(
            collectionData.id,
            files,
            token
          );
      
          if (response.success) {
            await loadAllModels();
            setSuccess(`${response.count} real model(s) uploaded successfully!`);
          } else {
            setError(response.error || "Failed to upload models");
          }
        } catch (err) {
          console.error("Error uploading real models:", err);
          setError(err.message || "Failed to upload real models");
        } finally {
          setUploadingReal(false);
          event.target.value = ""; // allow reselect
        }
      };
      

    const handleSelectModel = (model, type) => {
        console.log(`DEBUG: handleSelectModel: ${model}, ${type}`)
        setError(null)
        setSuccess(null)

        // ✅ Only update local state - no API call
        const newSelectedModel = { ...model, type }
        setSelectedModel(newSelectedModel)

        // Notify parent component about the selection change
        if (onModelSelectionChange) {
            onModelSelectionChange(newSelectedModel)
        }
    }

    const isModelSelected = (model, type) => {
        if (!selectedModel) return false
        if (selectedModel.type !== type) return false

        // ✅ Compare by ID if available
        if (selectedModel.id && model.id) {
            return selectedModel.id === model.id
        }

        // ✅ Fallback: compare Cloudinary/local URLs
        const selectedPath = selectedModel.cloud || selectedModel.local
        const modelPath = model.cloud || model.local

        return selectedPath && modelPath && selectedPath === modelPath
    }


    return (
        <div className="space-y-4">
        <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-gradient rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground text-2xl">Model Selection</h3>
                    <p className="text-sm text-muted-foreground">Select models for your project</p>
                </div>
            </div>

        <div className="mb-12">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 animate-fade-in">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 animate-fade-in">
                    <p className="text-green-600">{success}</p>
                </div>
            )}

            {/* Two Card Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Human Model Preview Card (Real Models) */}
                <div
                    className={`relative bg-card rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${activeTab === 'real'
                        ? 'border-gold-solid shadow-md'
                        : 'border-border hover:border-border'
                        }`}
                >
                    {/* Selected Badge */}
                    {activeTab === 'real' && (
                        <div className="absolute top-4 right-4 bg-gold-solid text-white text-xs font-semibold px-3 py-1.5 rounded-md z-10 animate-fade-in shadow-sm">
                            Selected
                        </div>
                    )}

                    {/* Card Header - Clickable to switch tab */}
                    <div
                        onClick={() => setActiveTab('real')}
                        className="p-6 border-b border-gray-100 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeTab === 'real' ? 'bg-gold-solid' : 'bg-muted'
                                }`}>
                                <Users className={`w-5 h-5 transition-colors ${activeTab === 'real' ? 'text-white' : 'text-muted-foreground'
                                    }`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-foreground">Human Model Preview</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Upload real model photos for automatic crop, pose detection, and professional guidelines.
                                </p>
                            </div>
                            {renderCommentButton("human_model_preview")}
                        </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6" onClick={(e) => e.stopPropagation()}>
                    <RealModelsTab
  realModels={realModels}
  uploading={uploadingReal}
  loading={loading}
  selectedModel={selectedModel}
  onUpload={handleUploadRealModels}
  isModelSelected={(model) => isModelSelected(model, 'real')}
  canEdit={canEdit}
  onDelete={handleDeleteModel}
  uploadError={realUploadError}
  onSelect={(model) => handleSelectModel(model, 'real')}
/>

                    </div>
                </div>

                {/* AI Model Preview Card */}
                <div
                    className={`relative bg-card rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:border-gold-muted/50 ${activeTab === 'ai'
                        ? 'border-amber-400 shadow-md'
                        : 'border-border hover:border-border'
                        }`}
                >
                    {/* Selected Badge */}
                    {activeTab === 'ai' && (
                        <div className="absolute top-4 right-4 bg-amber-400 text-white text-xs font-semibold px-3 py-1.5 rounded-md z-10 animate-fade-in shadow-sm">
                            Selected
                        </div>
                    )}

                    {/* Card Header - Clickable to switch tab */}
                    <div
                        onClick={() => setActiveTab('ai')}
                        className="p-6 border-b border-gray-100 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeTab === 'ai' ? 'bg-gold-solid' : 'bg-muted'
                                }`}>
                                <Sparkles className={`w-5 h-5 transition-colors ${activeTab === 'ai' ? 'text-white' : 'text-muted-foreground'
                                    }`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-foreground">AI Model Preview</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    AI automatically generates diverse models based on your project tone, style, and target audience.
                                </p>
                            </div>
                            {renderCommentButton("ai_model_preview")}
                        </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6" onClick={(e) => e.stopPropagation()}>
                        <AIModelsTab
                            aiModels={aiModels}
                            generatedModels={generatedModels}
                            generating={generating}
                            loading={loading}
                            selectedModel={selectedModel}
                            onGenerate={handleGenerateAIModels}
                            onSave={handleSaveAIModels}
                            onSelect={(model) => handleSelectModel(model, 'ai')}
                            isModelSelected={(model) => isModelSelected(model, 'ai')}
                            canEdit={canEdit}
                            onDelete={handleDeleteModel}
                        />
                    </div>
                </div>
            </div>
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
                                        <div key={comment.id} className="border border-border rounded-md p-2 bg-[#fafafa]">
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
                                                                className="w-full h-16 px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-gold-solid resize-none text-sm"
                                                            />
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setReplyingToCommentId(null)}
                                                                    className="px-2 py-1 text-xs rounded-md border border-[#dcdcdc] text-[#555] hover:bg-muted"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddReply(comment.id)}
                                                                    disabled={savingComments || !(replyDraftByCommentId[comment.id] || "").trim()}
                                                                    className="px-2 py-1 text-xs rounded-md bg-gold-solid text-white hover:brightness-110 disabled:opacity-60"
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
                                        className="w-full h-20 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-gold-solid resize-none text-sm"
                                    />

                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAddComment}
                                            disabled={savingComments || !draftComment.trim()}
                                            className="px-3 py-1.5 text-sm rounded-md bg-gold-solid text-white hover:brightness-110 disabled:opacity-60"
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
        </div>
    )
}

// AI Models Tab Component
function AIModelsTab({
    aiModels,
    generatedModels,
    generating,
    loading,
    selectedModel,
    onGenerate,
    onSave,
    onSelect,
    isModelSelected,
    canEdit = true,
    onDelete,
}) {
    const [tempSelectedModels, setTempSelectedModels] = useState([])

    // When new models are generated or saved models change, pre-select all saved models
    useEffect(() => {
        if (generatedModels.length > 0) {
            // Pre-select all existing saved models
            const savedUrls = aiModels.map(model => model.cloud || model.local)
            setTempSelectedModels(savedUrls)
        }
    }, [generatedModels.length, aiModels])

    const toggleTempSelection = (imageUrl) => {
        setTempSelectedModels(prev =>
            prev.includes(imageUrl)
                ? prev.filter(url => url !== imageUrl)
                : [...prev, imageUrl]
        )
    }

    const handleSaveClick = async () => {
        if (tempSelectedModels.length === 0) {
            return
        }
        const success = await onSave(tempSelectedModels)
        // Only clear selection if save was successful
        if (success) {
            setTempSelectedModels([])
        }
    }

    const allGeneratedUrls = generatedModels
    const hasSavedModels = aiModels.length > 0
    const hasGeneratedModels = generatedModels.length > 0

    return (
        <div className="space-y-6">
            {/* Generate Button */}
            <div>
                <Button
                    onClick={onGenerate}
                    disabled={generating || !canEdit}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-white gap-2 transition-all duration-200 disabled:opacity-50"
                    title={canEdit ? "" : "You need Editor or Owner role to generate models"}
                >
                    <Sparkles className="w-4 h-4" />
                    {generating ? 'Generating...' : 'Generate AI Models'}
                </Button>
            </div>

            {generating && (
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mx-auto mb-3"></div>
                        <p className="text-sm text-muted-foreground">Generating AI models... This may take a minute</p>
                    </div>
                </div>
            )}

            {/* Show all models (existing + newly generated) with save option when new models are generated */}
            {hasGeneratedModels && !generating && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-amber-800 text-xs">
                            💡 <strong>Select which models to keep:</strong> Your existing saved models are pre-selected.
                            Click to add new models or deselect existing ones.
                        </p>
                    </div>

                    {/* Existing Saved Models */}
                    {hasSavedModels && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground">
                                Your Existing Models
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {aiModels.map((model, index) => {
                                    const imageUrl = model.cloud || model.local
                                    const isSelected = tempSelectedModels.includes(imageUrl)

                                    return (
                                        <div
                                            key={`existing-${index}`}
                                            onClick={() => canEdit && toggleTempSelection(imageUrl)}
                                            className={`group relative border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${isSelected
                                                ? 'border-amber-400 shadow-lg'
                                                : 'border-border hover:border-amber-400/50'
                                                }`}
                                        >
                                            {/* Image */}
                                            <img
                                                src={imageUrl}
                                                alt={`Existing Model ${index + 1}`}
                                                className="w-full h-40 object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                            />

                                            {/* Selected checkmark */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-1 shadow-md z-10">
                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                </div>
                                            )}

                                            {/* 🗑 Delete button (hover only) */}
                                            {canEdit && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onDelete(model, "ai")
                                                    }}
                                                    className="
                        absolute top-2 left-2
                        bg-gradient-to-r from-red-500 to-red-700
                        text-white rounded-full p-1.5
                        opacity-0 group-hover:opacity-100
                        transition-all duration-300 ease-in-out
                        hover:scale-110 shadow-lg
                        z-10
                    "
                                                    title='Remove model'
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* Hover overlay with View and Select buttons */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        window.open(imageUrl, '_blank')
                                                    }}
                                                    className="bg-card hover:bg-muted text-amber-500 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                                {canEdit && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleTempSelection(imageUrl)
                                                        }}
                                                        className="bg-amber-400 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        {isSelected ? 'Deselect' : 'Select'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* "Existing" badge (moved down slightly to avoid overlap) */}
                                            <div className="absolute bottom-2 left-2 bg-green-600/90 text-white text-xs px-2 py-1 rounded shadow z-10">
                                                Existing
                                            </div>
                                        </div>
                                    )
                                })}


                            </div>
                        </div>
                    )}

                    {/* Newly Generated Models */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground">
                            Newly Generated Models
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {allGeneratedUrls.map((imageUrl, index) => {
                                const isSelected = tempSelectedModels.includes(imageUrl)
                                return (
                                    <div
                                        key={`new-${index}`}
                                        onClick={() => canEdit && toggleTempSelection(imageUrl)}
                                        className={`group relative border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${isSelected
                                            ? 'border-amber-400 shadow-lg'
                                            : 'border-border hover:border-amber-400/50'
                                            }`}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={`New Model ${index + 1}`}
                                            className="w-full h-40 object-cover"
                                        />
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-1 z-10 shadow-md">
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded z-10">
                                            New
                                        </div>
                                        {/* Hover overlay with View and Select buttons */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.open(imageUrl, '_blank')
                                                }}
                                                className="bg-card hover:bg-muted text-amber-500 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                View
                                            </button>
                                            {canEdit && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleTempSelection(imageUrl)
                                                    }}
                                                    className="bg-amber-400 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    {isSelected ? 'Deselect' : 'Select'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <Button
                        onClick={handleSaveClick}
                        disabled={loading || tempSelectedModels.length === 0 || !canEdit}
                        className="w-full bg-amber-400 hover:bg-amber-500 text-white transition-all duration-200 disabled:opacity-50"
                        title={canEdit ? "" : "You need Editor or Owner role to save models"}
                    >
                        {loading ? 'Saving...' : `Save Selected Models (${tempSelectedModels.length} total)`}
                    </Button>
                </div>
            )}

            {/* Show saved AI models */}
            {hasSavedModels && !hasGeneratedModels && (
                <div className="space-y-4 animate-fade-in">
                    <h4 className="text-sm font-semibold text-muted-foreground">Your AI Models</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {aiModels.map((model, index) => {
                            const imageUrl = model.cloud || model.local
                            const selected = isModelSelected(model)
                            console.log("selected ai model : ", selected)

                            return (
                                <div
                                    key={index}
                                    onClick={() => canEdit && onSelect(model)}
                                    className={`group relative border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${selected
                                        ? 'border-amber-400 shadow-lg ring-2 ring-amber-400 ring-offset-1'
                                        : 'border-border hover:border-amber-400/50'
                                        }`}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`AI Model ${index + 1}`}
                                        className="w-full h-40 object-cover"
                                    />
                                    {selected && (
                                        <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-1 shadow-md z-10">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    {/* Hover overlay with View and Select buttons */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                window.open(imageUrl, '_blank')
                                            }}
                                            className="bg-card hover:bg-muted text-amber-500 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            View
                                        </button>
                                        {canEdit && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onSelect(model)
                                                }}
                                                className="bg-amber-400 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Select
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {!generating && !hasSavedModels && !hasGeneratedModels && (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg bg-muted">
                    <Sparkles className="w-12 h-12 text-muted-foreground/70 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-2">No AI models generated yet</p>
                    <p className="text-xs text-muted-foreground/70">
                        Click "Generate AI Models" to create model images
                    </p>
                </div>
            )}
        </div>
    )
}

// Real Models Tab Component
function RealModelsTab({
    realModels,
    uploading,
    loading,
    selectedModel,
    onUpload,
    isModelSelected,
    canEdit = true,
    onDelete,
    uploadError,
    onSelect,
  }) {
    const hasModels = realModels.length > 0
    const fileInputRef = useRef(null)
    const handleButtonClick = () => {
        if (!uploading && canEdit && fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    return (
        <div className="space-y-6">
            {/* Upload Model Photo Section */}
            {uploadError && (
  <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
    <X className="w-4 h-4" />
    {uploadError}
  </div>
)}

            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Upload Model Photo</h4>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={onUpload}
                        disabled={uploading || !canEdit}
                        className="hidden"
                        style={{ display: 'none' }}
                    />
                    <button
  onClick={handleButtonClick}
  disabled={uploading || !canEdit}
  className={`w-full border-2 border-dashed rounded-lg px-6 py-4 flex flex-col items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
    uploadError
      ? "border-red-500 bg-red-50"
      : "bg-muted hover:bg-secondary border-border"
  }`}
>

                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {uploading ? 'Uploading...' : 'Upload Model Photo'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            JPG, PNG, or HEIC
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Max 10MB
                        </span>
                    </button>
                </div>

                {/* Upload Guidelines */}
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Upload Guidelines</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-gold-solid mt-0.5">•</span>
                            <span>High-resolution images (minimum 1200px width)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gold-solid mt-0.5">•</span>
                            <span>Well-lit with clear facial features</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gold-solid mt-0.5">•</span>
                            <span>Full body or upper body shots preferred</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gold-solid mt-0.5">•</span>
                            <span>Neutral background for best results</span>
                        </li>
                    </ul>
                </div>
            </div>

            {uploading && (
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-solid mx-auto mb-3"></div>
                        <p className="text-sm text-muted-foreground">Uploading models...</p>
                    </div>
                </div>
            )}

            {hasModels && !uploading && (
                <div className="space-y-4 animate-fade-in">
                    <h4 className="text-sm font-semibold text-muted-foreground">Your Uploaded Models</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {realModels.map((model, index) => {
                            const imageUrl = model.cloud || model.local
                            const selected = isModelSelected(model)

                            return (
                                <div
                                    key={index}
                                    className={`group relative border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${selected
                                        ? 'border-gold-solid shadow-lg ring-2 ring-gold-solid ring-offset-1'
                                        : 'border-border hover:border-gold-solid/50'
                                        }`}
                                    onClick={() => canEdit && onSelect(model)}
                                >
                                    {/* Model image */}
                                    <img
                                        src={imageUrl}
                                        alt={`Real Model ${index + 1}`}
                                        className="w-full h-40 object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                    />

                                    {/* Selected checkmark */}
                                    {selected && (
                                        <div className="absolute top-2 right-2 bg-gold-solid rounded-full p-1 z-10 shadow-md">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    {/* Delete button (hover only) */}
                                    {canEdit && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(model, "real")
                                            }}
                                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md hover:shadow-lg transform hover:scale-110 z-10"
                                            title="Remove model"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {/* Hover overlay with View button */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                window.open(imageUrl, '_blank')
                                            }}
                                            className="bg-card hover:bg-muted text-gold-solid px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            View
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {!uploading && !hasModels && (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg bg-muted">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/70 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No models uploaded yet</p>
                </div>
            )}
        </div>
    )
}
