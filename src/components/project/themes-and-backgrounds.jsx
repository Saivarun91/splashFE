import { ChevronDown, Upload, X, Image as ImageIcon, Eye, MessageCircle, Trash2, SwatchBook } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MultiSelect } from "@/components/ui/multi-select"
import { useState, useEffect, useRef } from "react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { formatRelativeCommentTime } from "@/lib/comment-time"
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_COMMENTS_BY_FIELD = {
    themes: [],
    backgrounds: [],
    poses: [],
    locations: [],
};


export function ThemesAndBackgrounds({ showSuggestions = false, collectionData, project, onSave, onSelectionsChange, onImagesChange, canEdit = true }) {
    const { token } = useAuth()
    const [selectedThemes, setSelectedThemes] = useState([])
    const [selectedBackgrounds, setSelectedBackgrounds] = useState([])
    const [uploadErrors, setUploadErrors] = useState({
        themes: null,
        backgrounds: null,
        poses: null,
        locations: null
      });
      
    const [selectedPoses, setSelectedPoses] = useState([])
    const [selectedLocations, setSelectedLocations] = useState([])
    const [activeCommentField, setActiveCommentField] = useState(null)
    const [commentsByField, setCommentsByField] = useState(DEFAULT_COMMENTS_BY_FIELD)
    const [draftComment, setDraftComment] = useState("")
    const [replyDraftByCommentId, setReplyDraftByCommentId] = useState({})
    const [replyingToCommentId, setReplyingToCommentId] = useState(null)
    const [commentError, setCommentError] = useState("")
    const [commentMessage, setCommentMessage] = useState("")
    const [savingComments, setSavingComments] = useState(false)
    const [nowMs, setNowMs] = useState(Date.now())

    // State for uploaded images (now includes server-stored images)
    const [uploadedImages, setUploadedImages] = useState({
        themes: [],
        backgrounds: [],
        poses: [],
        locations: []
    })

    // State for upload progress
    const [uploading, setUploading] = useState({
        themes: false,
        backgrounds: false,
        poses: false,
        locations: false
    })

    // File input refs
    const fileInputRefs = {
        themes: useRef(null),
        backgrounds: useRef(null),
        poses: useRef(null),
        locations: useRef(null)
    }

    // Export selections through a getter function
    const getSelections = () => ({
        themes: selectedThemes,
        backgrounds: selectedBackgrounds,
        poses: selectedPoses,
        locations: selectedLocations
    })

    // Notify parent of selection changes
    useEffect(() => {
        if (onSelectionsChange) {
            onSelectionsChange(getSelections())
        }
    }, [selectedThemes, selectedBackgrounds, selectedPoses, selectedLocations])

    // Notify parent of image changes
    useEffect(() => {
        if (onImagesChange) {
            onImagesChange(uploadedImages)
        }
    }, [uploadedImages])

    const commentFieldConfig = {
        themes: {
            payloadKey: "themes_comments",
            title: "Themes",
        },
        backgrounds: {
            payloadKey: "backgrounds_comments",
            title: "Backgrounds",
        },
        poses: {
            payloadKey: "poses_comments",
            title: "Sample Poses",
        },
        locations: {
            payloadKey: "locations_comments",
            title: "Location Inspiration",
        },
    }

    const activeCommentConfig = activeCommentField ? commentFieldConfig[activeCommentField] : null
    const currentComments = activeCommentField ? (commentsByField[activeCommentField] || []) : []

    // Get suggestions and selections from collection data
    const item = collectionData?.items?.[0]
    console.log("items : ", item)
    const aiSuggestions = {
        themes: (item?.suggested_themes || []).slice(0, 10),
        backgrounds: (item?.suggested_backgrounds || []).slice(0, 10),
        poses: (item?.suggested_poses || []).slice(0, 10),
        locations: (item?.suggested_locations || []).slice(0, 10)
    }

    // Load existing selections and uploaded images when collection data changes
    useEffect(() => {
        if (item) {
            setSelectedThemes(item.selected_themes || [])
            setSelectedBackgrounds(item.selected_backgrounds || [])
            setSelectedPoses(item.selected_poses || [])
            setSelectedLocations(item.selected_locations || [])

            // Load existing uploaded images from server
            const existingImages = {
                themes: (item.uploaded_theme_images || []).map(img => ({
                    id: img.id || Date.now() + Math.random(),
                    local_path: img.local_path,
                    cloud_url: img.cloud_url,
                    original_filename: img.original_filename,
                    uploaded_by: img.uploaded_by,
                    uploaded_at: img.uploaded_at,
                    file_size: img.file_size,
                    category: img.category,
                    url: img.cloud_url,
                    name: img.original_filename,
                    isFromServer: true // Flag to indicate this image was loaded from server
                })),
                backgrounds: (item.uploaded_background_images || []).map(img => ({
                    id: img.id || Date.now() + Math.random(),
                    local_path: img.local_path,
                    cloud_url: img.cloud_url,
                    original_filename: img.original_filename,
                    uploaded_by: img.uploaded_by,
                    uploaded_at: img.uploaded_at,
                    file_size: img.file_size,
                    category: img.category,
                    url: img.cloud_url,
                    name: img.original_filename,
                    isFromServer: true
                })),
                poses: (item.uploaded_pose_images || []).map(img => ({
                    id: img.id || Date.now() + Math.random(),
                    local_path: img.local_path,
                    cloud_url: img.cloud_url,
                    original_filename: img.original_filename,
                    uploaded_by: img.uploaded_by,
                    uploaded_at: img.uploaded_at,
                    file_size: img.file_size,
                    category: img.category,
                    url: img.cloud_url,
                    name: img.original_filename,
                    isFromServer: true
                })),
                locations: (item.uploaded_location_images || []).map(img => ({
                    id: img.id || Date.now() + Math.random(),
                    local_path: img.local_path,
                    cloud_url: img.cloud_url,
                    original_filename: img.original_filename,
                    uploaded_by: img.uploaded_by,
                    uploaded_at: img.uploaded_at,
                    file_size: img.file_size,
                    category: img.category,
                    url: img.cloud_url,
                    name: img.original_filename,
                    isFromServer: true
                }))
            }

            setUploadedImages(existingImages)
            console.log('Loaded existing images from server:', existingImages)
        }
    }, [item])

    useEffect(() => {
        setCommentsByField({
            themes: Array.isArray(collectionData?.themes_comments) ? collectionData.themes_comments : [],
            backgrounds: Array.isArray(collectionData?.backgrounds_comments) ? collectionData.backgrounds_comments : [],
            poses: Array.isArray(collectionData?.poses_comments) ? collectionData.poses_comments : [],
            locations: Array.isArray(collectionData?.locations_comments) ? collectionData.locations_comments : [],
        })
    }, [
        collectionData?.themes_comments,
        collectionData?.backgrounds_comments,
        collectionData?.poses_comments,
        collectionData?.locations_comments,
    ])

    const loadCommentsFromDb = async () => {
        if (!collectionData?.id || !token) return
        try {
            const latestCollection = await apiService.getCollection(collectionData.id, token, {
                cache: "no-store",
            })
            setCommentsByField({
                themes: Array.isArray(latestCollection?.themes_comments) ? latestCollection.themes_comments : [],
                backgrounds: Array.isArray(latestCollection?.backgrounds_comments) ? latestCollection.backgrounds_comments : [],
                poses: Array.isArray(latestCollection?.poses_comments) ? latestCollection.poses_comments : [],
                locations: Array.isArray(latestCollection?.locations_comments) ? latestCollection.locations_comments : [],
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
                        ? "text-red-400 hover:bg-red-500/10"
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

    const toggleSelection = (category, value) => {
        let setter, current
        switch (category) {
            case 'themes':
                setter = setSelectedThemes
                current = selectedThemes
                break
            case 'backgrounds':
                setter = setSelectedBackgrounds
                current = selectedBackgrounds
                break
            case 'poses':
                setter = setSelectedPoses
                current = selectedPoses
                break
            case 'locations':
                setter = setSelectedLocations
                current = selectedLocations
                break
            default:
                return
        }

        if (current.includes(value)) {
            setter(current.filter(item => item !== value))
        } else {
            setter([...current, value])
        }
    }

    // Handle file upload - now uploads immediately to server
    const handleFileUpload = async (category, files) => {
        if (!files || files.length === 0) return;
      
        // clear previous error for this category
        setUploadErrors(prev => ({ ...prev, [category]: null }));
      
        // validation
        for (const file of files) {
          if (file.size > MAX_IMAGE_BYTES) {
            setUploadErrors(prev => ({
              ...prev,
              [category]: "File size exceeded. Max 10MB allowed."
            }));
            return;
          }
      
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setUploadErrors(prev => ({
              ...prev,
              [category]: "Only JPG, PNG or WEBP images are allowed."
            }));
            return;
          }
        }
      
        if (!project?.id || !collectionData?.id) {
          console.error("Missing project or collection data");
          return;
        }
      
        setUploading(prev => ({ ...prev, [category]: true }));
      
        try {
          const response = await apiService.uploadWorkflowImage(
            project.id,
            collectionData.id,
            category,
            Array.from(files),
            token
          );
      
          if (response.success) {
            const newImages = response.uploaded_images.map(img => ({
              id: img.id || Date.now() + Math.random(),
              local_path: img.local_path,
              cloud_url: img.cloud_url,
              original_filename: img.original_filename,
              uploaded_by: img.uploaded_by,
              uploaded_at: img.uploaded_at,
              file_size: img.file_size,
              category: img.category,
              url: img.cloud_url,
              name: img.original_filename,
              isFromServer: false
            }));
      
            setUploadedImages(prev => ({
              ...prev,
              [category]: [...prev[category], ...newImages]
            }));
      
            console.log(`Successfully uploaded ${newImages.length} ${category} images`);
          } else {
            console.error("Upload failed:", response.error);
          }
        } catch (error) {
          console.error("Error uploading images:", error);
        } finally {
          setUploading(prev => ({ ...prev, [category]: false }));
        }
      };
      

    // Remove uploaded image
    const removeUploadedImage = async (category, imageId) => {
        if (!project?.id || !collectionData?.id) {
            console.error('Missing project or collection data')
            return
        }

        // Find the image to get its cloud_url
        const image = uploadedImages[category]?.find(img => img.id === imageId)
        if (!image) {
            console.error('Image not found in local state')
            return
        }

        try {
            const response = await apiService.removeWorkflowImage(
                project.id,
                collectionData.id,
                imageId,
                category,
                token,
                image.cloud_url || image.url
            )

            if (response.success) {
                // Remove from local state
                setUploadedImages(prev => ({
                    ...prev,
                    [category]: prev[category].filter(img => img.id !== imageId)
                }))

                // Refresh collection data
                const updatedData = await apiService.getCollection(collectionData.id, token)
                if (updatedData && onSave) {
                    await onSave({ imagesUpdated: true })
                }
            } else {
                console.error('Failed to remove image:', response.error)
            }
        } catch (error) {
            console.error('Error removing image:', error)
        }
    }

    // Handle file input change
    const handleFileInputChange = async (category, event) => {
        const files = event.target.files;
        await handleFileUpload(category, files);
        event.target.value = ""; // allow same file again
      };
      

    // Trigger file input
    const triggerFileInput = (category) => {
        if (fileInputRefs[category].current) {
            fileInputRefs[category].current.click()
        }
    }

    return (
        <>
      <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-gradient rounded-lg flex items-center justify-center">
                    <SwatchBook className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground text-2xl">Moodboard Setup</h3>
                    <p className="text-sm text-muted-foreground">Select themes, backgrounds, poses, and locations for your project</p>
                </div>
            </div>


        <div className="grid grid-cols-2 gap-6">


            {/* Themes */}
            
            <div
    className={`border-2 border-dashed rounded-lg p-6 transition-colors
      ${uploadErrors.themes
        ? "border-red-500 bg-red-500/10"
        : "border-gold-muted bg-card/40"
      }`}
  >
    

                <div>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-foreground text-lg mb-1">Themes</h3>
                        {renderCommentButton("themes")}
                    </div>
                    <p className="text-sm text-muted-foreground">Define project vision and upload inspiration</p>
                </div>

                {showSuggestions && aiSuggestions.themes.length > 0 && (
                    <div className="space-y-3">
                        <div className="bg-gold-solid/10 border border-gold-muted rounded-lg p-3 mb-3">
                            <p className="text-gold-solid text-sm font-medium">AI Suggested Themes</p>
                        </div>
                        <MultiSelect
                            options={aiSuggestions.themes}
                            selected={selectedThemes}
                            onChange={(newSelection) => setSelectedThemes(newSelection)}
                            placeholder="Select themes..."
                            disabled={!canEdit}
                        />
                    </div>
                )}

                <div className="space-y-3">
                    {showSuggestions && aiSuggestions.themes.length > 0 && (
                        <p className="text-sm text-muted-foreground text-center">Or</p>
                    )}

    {uploadErrors.themes && (
      <p className="text-xs text-red-400">
        {uploadErrors.themes}
      </p>
    )}


                    {/* Hidden file input */}
                    <input
                        ref={fileInputRefs.themes}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileInputChange('themes', e)}
                        className="hidden"
                        disabled={!canEdit}
                    />

                    <Button
                        variant="outline"
                        className="w-full border-border text-foreground hover:bg-secondary hover:text-foreground"
                        disabled={!canEdit || uploading.themes}
                        onClick={() => triggerFileInput('themes')}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading.themes ? 'Uploading...' : 'Choose files'}
                    </Button>

                    {/* Uploaded images preview */}
                    {uploadedImages.themes.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                {uploadedImages.themes.length} file(s) selected
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.themes.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-16 object-cover rounded border"
                                        />
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.open(image.url || image.cloud_url, '_blank')
                                                }}
                                                className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                                                title="View image"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => removeUploadedImage('themes', image.id)}
                                                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                disabled={!canEdit}
                                                title="Remove image"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Backgrounds */}
            {/* {uploadErrors.themes && (
  <div className="flex items-center gap-2 text-sm text-red-400">
    <X className="w-4 h-4" />
    {uploadErrors.backgrounds}
  </div>
)} */}

            <div
            
  className={`border-2 border-dashed rounded-lg p-6 space-y-4 transition-all ${
    uploadErrors.backgrounds
      ? "border-red-500 bg-red-500/10"
      : "border-gold-muted bg-card/40"
  }`}
>

                <div>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-foreground text-lg mb-1">Backgrounds</h3>
                        {renderCommentButton("backgrounds")}
                    </div>
                    <p className="text-sm text-muted-foreground">Define project vision and upload inspiration</p>
                </div>

                {showSuggestions && aiSuggestions.backgrounds.length > 0 && (
                    <div className="space-y-3">
                        <div className="bg-gold-solid/10 border border-gold-muted rounded-lg p-3 mb-3">
                            <p className="text-gold-solid text-sm font-medium">AI Suggested Backgrounds</p>
                        </div>
                        <MultiSelect
                            options={aiSuggestions.backgrounds}
                            selected={selectedBackgrounds}
                            onChange={(newSelection) => setSelectedBackgrounds(newSelection)}
                            placeholder="Select backgrounds..."
                            disabled={!canEdit}
                        />
                    </div>
                )}

                <div className="space-y-3">
                    {showSuggestions && aiSuggestions.backgrounds.length > 0 && (
                        <p className="text-sm text-muted-foreground text-center">Or</p>
                    )}
{uploadErrors.backgrounds && (
      <p className="text-xs text-red-400">
        {uploadErrors.backgrounds}
      </p>
    )}

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRefs.backgrounds}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileInputChange('backgrounds', e)}
                        className="hidden"
                        disabled={!canEdit}
                    />

                    <Button
                        variant="outline"
                        className="w-full border-border text-foreground hover:bg-secondary hover:text-foreground"
                        disabled={!canEdit || uploading.backgrounds}
                        onClick={() => triggerFileInput('backgrounds')}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading.backgrounds ? 'Uploading...' : 'Choose files'}
                    </Button>

                    {/* Uploaded images preview */}
                    {uploadedImages.backgrounds.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                {uploadedImages.backgrounds.length} file(s) selected
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.backgrounds.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-16 object-cover rounded border"
                                        />
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.open(image.url || image.cloud_url, '_blank')
                                                }}
                                                className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                                                title="View image"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => removeUploadedImage('backgrounds', image.id)}
                                                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                disabled={!canEdit}
                                                title="Remove image"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sample Poses */}
            <div
  className={`border-2 border-dashed rounded-lg p-6 space-y-4 transition-all ${
    uploadErrors.poses
      ? "border-red-500 bg-red-500/10"
      : "border-gold-muted bg-card/40"
  }`}
>

                <div>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-foreground text-lg mb-1">Sample Poses</h3>
                        {renderCommentButton("poses")}
                    </div>
                    <p className="text-sm text-muted-foreground">Define project vision and upload inspiration</p>
                    
                </div>
                

                {showSuggestions && aiSuggestions.poses.length > 0 && (
                    <div className="space-y-3">
                        <div className="bg-gold-solid/10 border border-gold-muted rounded-lg p-3 mb-3">
                            <p className="text-gold-solid text-sm font-medium">AI Suggested Poses</p>
                        </div>
                        <MultiSelect
                            options={aiSuggestions.poses}
                            selected={selectedPoses}
                            onChange={(newSelection) => setSelectedPoses(newSelection)}
                            placeholder="Select poses..."
                            disabled={!canEdit}
                        />
                    </div>
                )}

                <div className="space-y-3">
                    {showSuggestions && aiSuggestions.poses.length > 0 && (
                        <p className="text-sm text-muted-foreground text-center">Or</p>
                    )}
                    {uploadErrors.poses && (
      <p className="text-xs text-red-400">
        {uploadErrors.poses}
      </p>
    )}


                    {/* Hidden file input */}
                    <input
                        ref={fileInputRefs.poses}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileInputChange('poses', e)}
                        className="hidden"
                        disabled={!canEdit}
                    />

                    <Button
                        variant="outline"
                        className="w-full border-border text-foreground hover:bg-secondary hover:text-foreground"
                        disabled={!canEdit || uploading.poses}
                        onClick={() => triggerFileInput('poses')}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading.poses ? 'Uploading...' : 'Choose files'}
                    </Button>

                    {/* Uploaded images preview */}
                    {uploadedImages.poses.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                {uploadedImages.poses.length} file(s) selected
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.poses.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-16 object-cover rounded border"
                                        />
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.open(image.url || image.cloud_url, '_blank')
                                                }}
                                                className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                                                title="View image"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => removeUploadedImage('poses', image.id)}
                                                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                disabled={!canEdit}
                                                title="Remove image"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Location Inspiration */}<div
  className={`border-2 border-dashed rounded-lg p-6 space-y-4 transition-all ${
    uploadErrors.locations
      ? "border-red-500 bg-red-500/10"
      : "border-gold-muted bg-card/40"
  }`}
>

                <div>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-foreground text-lg mb-1">Location Inspiration</h3>
                        {renderCommentButton("locations")}
                    </div>
                    <p className="text-sm text-muted-foreground">Define project vision and upload inspiration</p>
                </div>

                {showSuggestions && aiSuggestions.locations.length > 0 && (
                    <div className="space-y-3">
                        <div className="bg-gold-solid/10 border border-gold-muted rounded-lg p-3 mb-3">
                            <p className="text-gold-solid text-sm font-medium">AI Suggested Locations</p>
                        </div>
                        <MultiSelect
                            options={aiSuggestions.locations}
                            selected={selectedLocations}
                            onChange={(newSelection) => setSelectedLocations(newSelection)}
                            placeholder="Select locations..."
                            disabled={!canEdit}
                        />
                    </div>
                )}

                <div className="space-y-3">
                    {showSuggestions && aiSuggestions.locations.length > 0 && (
                        <p className="text-sm text-muted-foreground text-center">Or</p>
                    )}
{uploadErrors.locations && (
      <p className="text-xs text-red-400">
        {uploadErrors.locations}
      </p>
    )}

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRefs.locations}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileInputChange('locations', e)}
                        className="hidden"
                        disabled={!canEdit}
                    />

                    <Button
                        variant="outline"
                        className="w-full border-border text-foreground hover:bg-secondary hover:text-foreground"
                        disabled={!canEdit || uploading.locations}
                        onClick={() => triggerFileInput('locations')}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading.locations ? 'Uploading...' : 'Choose files'}
                    </Button>

                    {/* Uploaded images preview */}
                    {uploadedImages.locations.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                {uploadedImages.locations.length} file(s) selected
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.locations.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-16 object-cover rounded border"
                                        />
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.open(image.url || image.cloud_url, '_blank')
                                                }}
                                                className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                                                title="View image"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => removeUploadedImage('locations', image.id)}
                                                className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                disabled={!canEdit}
                                                title="Remove image"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                                className="p-1 rounded hover:bg-gray-100"
                                aria-label="Close comments"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
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
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        {(comment.authorName || "Member")} • {formatRelativeCommentTime(comment.createdAt, nowMs)}
                                                    </p>
                                                    <p className="text-sm text-foreground break-words">{comment.comment}</p>
                                                    {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                                                        <div className="mt-2 pl-3 border-l border-border space-y-2">
                                                            {comment.replies.map((reply) => (
                                                                <div key={reply.id} className="bg-muted border border-border rounded p-2">
                                                                    <p className="text-xs font-medium text-muted-foreground">
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
                                                                className="text-xs text-gold-solid hover:brightness-110"
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
                                                                    className="px-2 py-1 text-xs rounded-md border border-border text-muted-foreground hover:bg-secondary"
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
                                                        className="text-red-500 hover:text-red-400 p-1"
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

                            {commentError && <p className="text-xs text-red-400">{commentError}</p>}
                            {commentMessage && <p className="text-xs text-green-600">{commentMessage}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    )
}
