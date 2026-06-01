import { useState, useEffect, useMemo } from "react"
import { Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useImageGeneration } from "@/context/ImageGenerationContext"

function getUserFriendlyError(error) {
    if (!error) return "Something went wrong. Please try again."
    if (error.response) {
        const status = error.response.status
        const msg = error.response.data?.error || error.response.data?.message
        if (msg && typeof msg === "string" && msg.length < 300) return msg
        switch (status) {
            case 400: return "Something seems incorrect. Please check your selection and try again."
            case 401: return "Your session has expired. Please log in again."
            case 403: return "You don't have permission to perform this action."
            case 404: return "The requested item was not found."
            case 429: return "Too many requests. Please wait a moment and try again."
            case 500: return "Something went wrong on our side. Please try again in a few moments."
            default: return "An unexpected error occurred. Please try again."
        }
    }
    if (error.request) return "Network issue. Please check your connection and try again."
    return error.message || "Something went wrong. Please try again."
}

export function GenerateSection({ project, collectionData, onGenerate, canEdit, isOwner = false, productUploadPageRef = null }) {
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [selectedModel, setSelectedModel] = useState(null)
    const [generationProgress, setGenerationProgress] = useState(null) // { current: 1, total: 3 }
    const [selections, setSelections] = useState(null)
    const { token } = useAuth()
    const { setIsGenerating } = useImageGeneration()
    
    // Get the selected model from backend
    useEffect(() => {
        const loadSelectedModel = async () => {
            if (collectionData?.id) {
                try {
                    const response = await apiService.getAllModels(collectionData.id, token)
                    if (response.success && response.selected_model) {
                        setSelectedModel(response.selected_model.local || response.selected_model.cloud)
                    }
                } catch (err) {
                    console.error('Error loading selected model:', err)
                }
            }
        }
        loadSelectedModel()
    }, [collectionData, token])

    // Poll for selections from ProductUploadPage
    useEffect(() => {
        const updateSelections = () => {
            if (productUploadPageRef && productUploadPageRef.current) {
                const currentSelections = productUploadPageRef.current.getSelections()
                setSelections(currentSelections)
            }
        }
        
        // Update immediately
        updateSelections()
        
        // Poll every 500ms to catch selection changes
        const interval = setInterval(updateSelections, 500)
        
        return () => clearInterval(interval)
    }, [productUploadPageRef])

    const handleGenerate = async () => {
        if (!collectionData?.id) {
            setError('No collection found')
            return
        }

        const productImages = collectionData?.items?.[0]?.product_images
        if (!productImages || productImages.length === 0) {
            setError('Please upload product images first')
            return
        }

        if (!selectedModel) {
            setError('No model selected. Please generate and save models in Step 2')
            return
        }

        setGenerating(true)
        setIsGenerating(true)
        setError(null)
        setSuccess(null)

        try {
            // Get image type selections from ProductUploadPage if ref is available
            let imageTypeSelections = null
            if (productUploadPageRef && productUploadPageRef.current) {
                const currentSelections = productUploadPageRef.current.getSelections()
                // Convert selections to the format expected by backend
                // Frontend format: { 0: { plainBg: true, bgReplace: false, ... }, ... }
                // Backend expects the same format
                if (currentSelections && Object.keys(currentSelections).length > 0) {
                    imageTypeSelections = currentSelections
                }
            } else if (selections && Object.keys(selections).length > 0) {
                // Fallback to state if ref not available
                imageTypeSelections = selections
            }

            // Validate that at least one image type is selected
            if (imageTypeSelections) {
                const hasAnySelection = Object.values(imageTypeSelections).some(sel => 
                    sel && typeof sel === 'object' && (sel.plainBg || sel.bgReplace || sel.model || sel.campaign)
                )
                if (!hasAnySelection) {
                    setError('Please select at least one image type to generate in Step 3 (Product Upload)')
                    setGenerating(false)
                    setIsGenerating(false)
                    return
                }
            }

            const response = await apiService.generateProductModelImagesWithPolling(
                collectionData.id,
                imageTypeSelections,
                token,
                (jobStatus) => {
                    // jobStatus from /api/jobs/{job_id}/images/
                    if (jobStatus) {
                        setGenerationProgress({
                            current: jobStatus.completed_images || 0,
                            total: jobStatus.total_images || 0,
                        })
                        console.log('Generation progress:', jobStatus.status, jobStatus.completed_images, '/', jobStatus.total_images)
                    }
                }
            )

            if (response.success) {
                setSuccess(`Generated ${response.total_generated || 0} images successfully!`)
                if (onGenerate) {
                    // Notify parent so it can refresh collection data from backend
                    await onGenerate({ imagesGenerated: true, jobId: response.job_id })
                }
                setTimeout(() => setSuccess(null), 5000)
            } else {
                setError(response.error || 'Failed to generate images')
            }
        } catch (err) {
            console.error('Error generating images:', err)
            setError(getUserFriendlyError(err) || err?.message || 'Failed to generate images')
        } finally {
            setGenerating(false)
            setIsGenerating(false)
        }
    }
    console.log("canEdit", canEdit);
    const hasProducts = collectionData?.items?.[0]?.product_images?.length > 0
    const hasModelSelected = selectedModel !== null

    // Calculate total selected images
    const totalSelectedImages = useMemo(() => {
        if (!selections || Object.keys(selections).length === 0) return null
        
        let total = 0
        Object.values(selections).forEach(sel => {
            if (sel && typeof sel === 'object') {
                if (sel.plainBg) total++
                if (sel.bgReplace) total++
                if (sel.model) total++
                if (sel.campaign) total++
            }
        })
        return total > 0 ? total : null
    }, [selections])

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between py-6 px-6 bg-card border border-border rounded-lg">
                <div>
                    <h3 className="font-semibold text-foreground mb-1">Generate Final Images</h3>
                    <p className="text-sm text-muted-foreground">
                        Combine products with AI models to create final images
                    </p>
                    {hasProducts && hasModelSelected && (
                        <p className="text-xs text-green-400 mt-1">
                            {totalSelectedImages !== null && totalSelectedImages > 0 ? (
                                <>✓ Ready to generate {totalSelectedImages} image{totalSelectedImages !== 1 ? 's' : ''} ({totalSelectedImages} credits required)</>
                            ) : (
                                <>⚠️ Select image types in Step 3 (Product Upload) to generate</>
                            )}
                        </p>
                    )}
                </div>
                <Button
                    onClick={handleGenerate}
                    disabled={generating || !hasProducts || !hasModelSelected || !isOwner || (totalSelectedImages !== null && totalSelectedImages === 0)}
                    variant="brand"
                    className="gap-2"
                    title={
                        !isOwner ? "You need Owner role to generate images" :
                        (totalSelectedImages === 0 ? "Please select at least one image type in Step 3" : "")
                    }
                >
                    <Sparkles className="w-4 h-4" />
                    {generating ? 'Generating...' : 'Generate Product Images'}
                </Button>
            </div>

            {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-400 text-sm">✓ {success}</p>
                </div>
            )}

            {generating && (
                <div className="mt-4 bg-gold-solid/10 border border-gold-muted rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gold-solid"></div>
                        <div className="flex-1">
                            <p className="text-gold-solid text-sm">
                                Generating images... This may take several minutes depending on the number of products.
                            </p>
                            {generationProgress && (
                                <p className="text-muted-foreground text-xs mt-1">
                                    Processing product {generationProgress.current} of {generationProgress.total}...
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {(!hasProducts || !hasModelSelected) && !error && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <p className="text-amber-300 text-sm">
                        {!hasModelSelected && '⚠️ Please select a model (AI or Real) in Step 2'}
                        {!hasProducts && hasModelSelected && '⚠️ Please upload product images in Step 3'}
                    </p>
                </div>
            )}
        </div>
    )
}
