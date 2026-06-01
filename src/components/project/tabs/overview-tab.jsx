// "use client"

// import { useState, useEffect } from "react"
// import { CircleDot, Clock, Calendar, FileText, Image as ImageIcon, Package, User, CheckCircle } from "lucide-react"
// import { ProductImagesDisplay } from "../product-images-display"
// import { apiService } from "@/lib/api"

// export default function OverviewTab({ project }) {
//     const [collectionData, setCollectionData] = useState(null)
//     const [loading, setLoading] = useState(true)
//     const [stats, setStats] = useState({
//         totalImages: 0,
//         products: 0,
//         variations: 0,
//         completion: 0
//     })

//     const loadData = async () => {
//         if (!project?.collection_id) {
//             setLoading(false)
//             return
//         }

//         try {
//             setLoading(true)
//             const data = await apiService.getCollection(project.collection_id)
//             setCollectionData(data)

//             // Calculate stats
//             if (data?.items?.[0]) {
//                 const item = data.items[0]
//                 const products = item.product_images || []
//                 const totalGenerated = products.reduce((sum, p) =>
//                     sum + (p.generated_images?.length || 0), 0
//                 )

//                 // Calculate completion percentage
//                 let completionSteps = 0
//                 if (data.description) completionSteps += 25
//                 if (item.selected_model) completionSteps += 25
//                 if (products.length > 0) completionSteps += 25
//                 if (totalGenerated > 0) completionSteps += 25

//                 setStats({
//                     totalImages: totalGenerated,
//                     products: products.length,
//                     variations: products.length > 0 ? Math.floor(totalGenerated / products.length) : 0,
//                     completion: completionSteps
//                 })
//             }
//         } catch (err) {
//             console.error('Error loading overview:', err)
//         } finally {
//             setLoading(false)
//         }
//     }

//     useEffect(() => {
//         loadData()
//     }, [project])

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center py-12">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-solid mx-auto mb-4"></div>
//                     <p className="text-muted-foreground">Loading overview...</p>
//                 </div>
//             </div>
//         )
//     }

//     return (
//         <div className="space-y-8">
//             {/* Project Details Card */}
//             <div className="bg-card border-2 border-border rounded-lg p-8">
//                 <h2 className="text-2xl font-bold text-foreground mb-6">Project Overview</h2>

//                 <div className="grid grid-cols-2 gap-6">
//                     <div className="flex items-start gap-4">
//                         <div className="w-12 h-12 bg-gold-solid/10 rounded-lg flex items-center justify-center flex-shrink-0">
//                             <FileText className="w-6 h-6 text-gold-solid" />
//                         </div>
//                         <div>
//                             <p className="text-sm text-muted-foreground mb-1">Project Name</p>
//                             <p className="text-lg font-semibold text-foreground">{project?.title || 'Untitled Project'}</p>
//                         </div>
//                     </div>

//                     <div className="flex items-start gap-4">
//                         <div className="w-12 h-12 bg-gold-solid/10 rounded-lg flex items-center justify-center flex-shrink-0">
//                             <CircleDot className="w-6 h-6 text-gold-solid" />
//                         </div>
//                         <div>
//                             <p className="text-sm text-muted-foreground mb-1">Status</p>
//                             <div className="flex items-center gap-2">
//                                 <div className={`w-2 h-2 rounded-full ${project?.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
//                                 <p className="text-lg font-semibold text-foreground">{project?.status || 'In Progress'}</p>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="flex items-start gap-4">
//                         <div className="w-12 h-12 bg-gold-solid/10 rounded-lg flex items-center justify-center flex-shrink-0">
//                             <Calendar className="w-6 h-6 text-gold-solid" />
//                         </div>
//                         <div>
//                             <p className="text-sm text-muted-foreground mb-1">Created Date</p>
//                             <p className="text-lg font-semibold text-foreground">
//                                 {project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
//                             </p>
//                         </div>
//                     </div>

//                     <div className="flex items-start gap-4">
//                         <div className="w-12 h-12 bg-gold-solid/10 rounded-lg flex items-center justify-center flex-shrink-0">
//                             <Clock className="w-6 h-6 text-gold-solid" />
//                         </div>
//                         <div>
//                             <p className="text-sm text-muted-foreground mb-1">Last Modified</p>
//                             <p className="text-lg font-semibold text-foreground">
//                                 {project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
//                             </p>
//                         </div>
//                     </div>
//                 </div>

//                 {project?.description && (
//                     <div className="mt-6 pt-6 border-t border-border">
//                         <p className="text-sm text-muted-foreground mb-2">Description</p>
//                         <p className="text-foreground">{project.description}</p>
//                     </div>
//                 )}

//                 {collectionData?.description && (
//                     <div className="mt-6 pt-6 border-t border-border">
//                         <p className="text-sm text-muted-foreground mb-2">Collection Description</p>
//                         <p className="text-foreground">{collectionData.description}</p>
//                     </div>
//                 )}
//             </div>

//             {/* Quick Stats */}
//             <div className="grid grid-cols-4 gap-6">
//                 <div className="bg-card border-2 border-border rounded-lg p-6">
//                     <div className="flex items-center gap-3 mb-3">
//                         <div className="w-10 h-10 bg-gold-solid/10 rounded-lg flex items-center justify-center">
//                             <ImageIcon className="w-5 h-5 text-gold-solid" />
//                         </div>
//                         <p className="text-sm text-muted-foreground">Total Images</p>
//                     </div>
//                     <p className="text-3xl font-bold text-gold-solid">{stats.totalImages}</p>
//                 </div>

//                 <div className="bg-card border-2 border-border rounded-lg p-6">
//                     <div className="flex items-center gap-3 mb-3">
//                         <div className="w-10 h-10 bg-gold-solid/10 rounded-lg flex items-center justify-center">
//                             <Package className="w-5 h-5 text-gold-solid" />
//                         </div>
//                         <p className="text-sm text-muted-foreground">Products</p>
//                     </div>
//                     <p className="text-3xl font-bold text-gold-solid">{stats.products}</p>
//                 </div>

//                 <div className="bg-card border-2 border-border rounded-lg p-6">
//                     <div className="flex items-center gap-3 mb-3">
//                         <div className="w-10 h-10 bg-gold-solid/10 rounded-lg flex items-center justify-center">
//                             <User className="w-5 h-5 text-gold-solid" />
//                         </div>
//                         <p className="text-sm text-muted-foreground">Model Used</p>
//                     </div>
//                     <p className="text-lg font-bold text-gold-solid">
//                         {collectionData?.items?.[0]?.selected_model?.type === 'ai' ? 'AI' :
//                             collectionData?.items?.[0]?.selected_model?.type === 'real' ? 'Real' : 'None'}
//                     </p>
//                 </div>

//                 <div className="bg-card border-2 border-border rounded-lg p-6">
//                     <div className="flex items-center gap-3 mb-3">
//                         <div className="w-10 h-10 bg-gold-solid/10 rounded-lg flex items-center justify-center">
//                             <CheckCircle className="w-5 h-5 text-gold-solid" />
//                         </div>
//                         <p className="text-sm text-muted-foreground">Completion</p>
//                     </div>
//                     <p className="text-3xl font-bold text-gold-solid">{stats.completion}%</p>
//                 </div>
//             </div>

//             {/* Workflow Progress */}
//             <div className="bg-card border-2 border-border rounded-lg p-6">
//                 <h3 className="text-lg font-semibold text-foreground mb-4">Workflow Progress</h3>
//                 <div className="space-y-3">
//                     <div className="flex items-center gap-3">
//                         <div className={`w-6 h-6 rounded-full flex items-center justify-center ${collectionData?.description ? 'bg-green-500' : 'bg-muted'}`}>
//                             {collectionData?.description && <CheckCircle className="w-4 h-4 text-white" />}
//                         </div>
//                         <p className="text-sm text-foreground">Step 1: Project Setup</p>
//                     </div>
//                     <div className="flex items-center gap-3">
//                         <div className={`w-6 h-6 rounded-full flex items-center justify-center ${collectionData?.items?.[0]?.selected_model ? 'bg-green-500' : 'bg-muted'}`}>
//                             {collectionData?.items?.[0]?.selected_model && <CheckCircle className="w-4 h-4 text-white" />}
//                         </div>
//                         <p className="text-sm text-foreground">Step 2: Model Selection</p>
//                     </div>
//                     <div className="flex items-center gap-3">
//                         <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stats.products > 0 ? 'bg-green-500' : 'bg-muted'}`}>
//                             {stats.products > 0 && <CheckCircle className="w-4 h-4 text-white" />}
//                         </div>
//                         <p className="text-sm text-foreground">Step 3: Product Upload</p>
//                     </div>
//                     <div className="flex items-center gap-3">
//                         <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stats.totalImages > 0 ? 'bg-green-500' : 'bg-muted'}`}>
//                             {stats.totalImages > 0 && <CheckCircle className="w-4 h-4 text-white" />}
//                         </div>
//                         <p className="text-sm text-foreground">Step 4: Image Generation</p>
//                     </div>
//                 </div>
//             </div>

//             {/* Preview of Generated Images */}
//             {stats.totalImages > 0 && (
//                 <div>
//                     <h3 className="text-xl font-bold text-foreground mb-4">Generated Images Preview</h3>
//                     <ProductImagesDisplay
//                         collectionData={collectionData}
//                         showRegenerate={false}
//                     />
//                 </div>
//             )}
//         </div>
//     )
// }


"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { CircleDot, Clock, Calendar, FileText, Image as ImageIcon, Package, User, CheckCircle, Palette, MapPin, Camera, Sparkles } from "lucide-react"
import { ProductImagesDisplay } from "../product-images-display"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { dataCache, cacheKeys } from "@/lib/data-cache"

export default function OverviewTab({ project }) {
    const [collectionData, setCollectionData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalImages: 0,
        products: 0,
        variations: 0,
        completion: 0
    })
    const [modelStats, setModelStats] = useState({
        total_models_used: 0,
        models_breakdown: [],
        total_generations: 0
    })
    const { token } = useAuth()

    const loadData = async () => {
        if (!project?.collection?.id || !token) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            
            // Try cache first for instant display
            const collectionCacheKey = cacheKeys.collection(project.collection.id);
            const modelStatsCacheKey = cacheKeys.modelStats(project.collection.id);
            const cachedCollection = dataCache.get(collectionCacheKey);
            const cachedModelStats = dataCache.get(modelStatsCacheKey);
            
            if (cachedCollection) {
                setCollectionData(cachedCollection);
                if (cachedModelStats) {
                    setModelStats(cachedModelStats);
                }
                setLoading(false);
            }

            // Fetch collection and model stats in parallel with caching
            const [data, modelUsageData] = await Promise.allSettled([
                dataCache.getOrFetch(
                    collectionCacheKey,
                    () => apiService.getCollection(project.collection.id, token),
                    2 * 60 * 1000 // 2 minutes cache
                ),
                dataCache.getOrFetch(
                    modelStatsCacheKey,
                    () => apiService.getModelUsageStats(project.collection.id, token).then(r => r.success ? r : null),
                    2 * 60 * 1000
                ).catch(() => null)
            ])

            if (data.status === 'fulfilled') {
                const collectionData = data.value
                setCollectionData(collectionData)

                if (collectionData?.items?.[0]) {
                    const item = collectionData.items[0]
                    const products = item.product_images || []
                    const totalGenerated = products.reduce((sum, p) => sum + (p.generated_images?.length || 0), 0)

                    const completionSteps = [
                        collectionData.description ? 1 : 0,
                        item.selected_model ? 1 : 0,
                        products.length > 0 ? 1 : 0,
                        totalGenerated > 0 ? 1 : 0
                    ].reduce((a, b) => a + b, 0)

                    setStats({
                        totalImages: totalGenerated,
                        products: products.length,
                        variations: products.length > 0 ? Math.floor(totalGenerated / products.length) : 0,
                        completion: Math.floor((completionSteps / 4) * 100)
                    })
                }
            }

            if (modelUsageData.status === 'fulfilled' && modelUsageData.value?.success) {
                setModelStats({
                    total_models_used: modelUsageData.value.total_models_used || 0,
                    models_breakdown: modelUsageData.value.models_breakdown || [],
                    total_generations: modelUsageData.value.total_generations || 0
                })
            }
        } catch (err) {
            console.error('Error loading overview:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [project?.collection?.id, token])

    // Calculate generation status counts - memoized (must be before early return)
    const item = collectionData?.items?.[0] || {}
    const generationStats = useMemo(() => {
        const stats = {
            whiteBackground: 0,
            backgroundReplace: 0,
            modelImages: 0,
            campaignImages: 0,
            regenerated: 0
        }

        if (item?.product_images) {
            item.product_images.forEach(product => {
                if (product.generated_images) {
                    product.generated_images.forEach(img => {
                        if (img.type === 'white_background') stats.whiteBackground++
                        else if (img.type === 'background_replace') stats.backgroundReplace++
                        else if (img.type === 'model_image') stats.modelImages++
                        else if (img.type === 'campaign_image') stats.campaignImages++

                        // Count regenerated images
                        if (img.regenerated_images) {
                            stats.regenerated += img.regenerated_images.length
                        }
                    })
                }
            })
        }
        return stats
    }, [item?.product_images])

    // Show skeleton only if no cached data - never block with spinner
    if (loading && !collectionData) {
        return (
            <div className="space-y-8">
                <div className="bg-card border-2 border-border rounded-lg p-8 animate-pulse">
                    <div className="h-8 bg-muted rounded w-48 mb-6"></div>
                    <div className="grid grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
                <div className="bg-card border-2 border-border rounded-lg p-8 animate-pulse">
                    <div className="h-8 bg-muted rounded w-64 mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">

            {/* Project & Collection Details */}
            <div className="bg-card border-2 border-border rounded-lg p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Project Overview</h2>
                <div className="grid grid-cols-2 gap-6">
                    {/* Project Name */}
                    <InfoCard icon={<FileText className="w-6 h-6 text-gold-solid" />} label="Project Name" value={project?.title || 'Untitled Project'} />
                    {/* Status */}
                    <InfoCard icon={<CircleDot className="w-6 h-6 text-gold-solid" />} label="Status" value={project?.status || 'progress'} dotColor={project?.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'} />
                    {/* Created Date */}
                    <InfoCard icon={<Calendar className="w-6 h-6 text-gold-solid" />} label="Created Date" value={project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'} />
                    {/* Last Modified */}
                    <InfoCard icon={<Clock className="w-6 h-6 text-gold-solid" />} label="Latest Updated" value={project?.updated_at ? new Date(project.updated_at).toLocaleDateString() : (project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A')} />
                </div>

                {collectionData?.description && <Description label="Collection Description" text={collectionData.description} />}
            </div>

            {/* Selected Themes, Backgrounds, Poses, Locations, Colors Section */}
            <div className="bg-card border-2 border-border rounded-lg p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Selected Elements</h2>

                <div className="space-y-6">
                    {/* Themes */}
                    {(item.selected_themes?.length > 0 || item.uploaded_theme_images?.length > 0) && (
                        <SelectionSection
                            title="Themes"
                            icon={<Sparkles className="w-5 h-5 text-gold-solid" />}
                            selected={item.selected_themes || []}
                            uploadedImages={item.uploaded_theme_images || []}
                        />
                    )}

                    {/* Backgrounds */}
                    {(item.selected_backgrounds?.length > 0 || item.uploaded_background_images?.length > 0) && (
                        <SelectionSection
                            title="Backgrounds"
                            icon={<ImageIcon className="w-5 h-5 text-gold-solid" />}
                            selected={item.selected_backgrounds || []}
                            uploadedImages={item.uploaded_background_images || []}
                        />
                    )}

                    {/* Poses */}
                    {(item.selected_poses?.length > 0 || item.uploaded_pose_images?.length > 0) && (
                        <SelectionSection
                            title="Poses"
                            icon={<Camera className="w-5 h-5 text-gold-solid" />}
                            selected={item.selected_poses || []}
                            uploadedImages={item.uploaded_pose_images || []}
                        />
                    )}

                    {/* Locations */}
                    {(item.selected_locations?.length > 0 || item.uploaded_location_images?.length > 0) && (
                        <SelectionSection
                            title="Locations"
                            icon={<MapPin className="w-5 h-5 text-gold-solid" />}
                            selected={item.selected_locations || []}
                            uploadedImages={item.uploaded_location_images || []}
                        />
                    )}

                    {/* Colors */}
                    {(item.selected_colors?.length > 0 || item.picked_colors?.length > 0 || item.uploaded_color_images?.length > 0) && (
                        <div className="border-t border-border pt-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gold-solid/10 rounded-lg flex items-center justify-center">
                                    <Palette className="w-5 h-5 text-gold-solid" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Colors</h3>
                            </div>

                            {/* Selected Colors */}
                            {item.selected_colors?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-muted-foreground mb-2">Selected Colors:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.selected_colors.map((color, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-gold-solid/10 text-gold-solid rounded-full text-sm">
                                                {color}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Picked Colors */}
                            {item.picked_colors?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-muted-foreground mb-2">Picked Colors:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.picked_colors.map((color, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div
                                                    className="w-8 h-8 rounded-full border-2 border-gray-300"
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                                <span className="text-xs text-muted-foreground">{color}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Uploaded Color Images */}
                            {item.uploaded_color_images?.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Uploaded Color Images:</p>
                                    <div className="grid grid-cols-4 gap-4">
                                        {item.uploaded_color_images.map((img, idx) => (
                                            <div key={idx} className="relative w-full h-24 rounded-lg border border-border overflow-hidden">
                                                <Image
                                                    src={img.cloud_url || img.local_url}
                                                    alt={`Color ${idx + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 25vw, 25vw"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Global Instructions */}
                    {item.global_instructions && (
                        <div className="border-t border-border pt-6">
                            <h3 className="text-lg font-semibold text-foreground mb-2">Global Instructions</h3>
                            <p className="text-foreground bg-muted p-4 rounded-lg">{item.global_instructions}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Two Stat Cards: Model Selection and Products */}
            <div className="grid grid-cols-2 gap-6">
                {/* Model Selection Stat Card */}
                <div className="bg-card border-2 border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gold-solid/10 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-gold-solid" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Model Selection</h3>
                    </div>
                    {item.selected_model ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="relative w-20 h-20 rounded-lg border-2 border-gold-solid overflow-hidden">
                                    <Image
                                        src={item.selected_model.cloud || item.selected_model.local}
                                        alt="Selected Model"
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground capitalize">
                                        {item.selected_model.type === 'ai' ? 'AI Model' : 'Real Model'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.selected_model.type === 'ai' ? 'Generated' : 'Uploaded'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No model selected</p>
                    )}
                </div>

                {/* Products Stat Card */}
                <div className="bg-card border-2 border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gold-solid/10 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gold-solid" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Products</h3>
                    </div>
                    <p className="text-3xl font-bold text-gold-solid mb-2">{stats.products}</p>
                    <p className="text-sm text-muted-foreground">Product images uploaded</p>
                </div>
            </div>

            {/* Generation Status Section */}
            <div className="bg-card border-2 border-border rounded-lg p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Generation Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <GenerationStatCard
                        label="Plain/White Background"
                        value={generationStats.whiteBackground}
                        icon={<ImageIcon className="w-5 h-5 text-gold-solid" />}
                    />
                    <GenerationStatCard
                        label="Background Replace"
                        value={generationStats.backgroundReplace}
                        icon={<ImageIcon className="w-5 h-5 text-gold-solid" />}
                    />
                    <GenerationStatCard
                        label="Model Images"
                        value={generationStats.modelImages}
                        icon={<User className="w-5 h-5 text-gold-solid" />}
                    />
                    <GenerationStatCard
                        label="Campaign Images"
                        value={generationStats.campaignImages}
                        icon={<Camera className="w-5 h-5 text-gold-solid" />}
                    />
                    <GenerationStatCard
                        label="Regenerated Images"
                        value={generationStats.regenerated}
                        icon={<Sparkles className="w-5 h-5 text-gold-solid" />}
                    />
                </div>
            </div>

            {/* Model Usage Statistics */}


            {/* Workflow Progress */}


            {/* Preview of Generated Images */}

        </div>
    )
}

// -----------------
// Helper Components
// -----------------
const InfoCard = ({ icon, label, value, dotColor }) => (
    <div className="flex items-start gap-4">
        <div className={`w-12 h-12 bg-gold-solid/10 rounded-lg flex items-center justify-center flex-shrink-0 ${dotColor ? '' : ''}`}>
            {dotColor && <div className={`w-2 h-2 rounded-full ${dotColor}`} />}
            {!dotColor && icon}
        </div>
        <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
    </div>
)

const Description = ({ label, text }) => (
    <div className="mt-6 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground mb-2">{label}</p>
        <p className="text-foreground">{text}</p>
    </div>
)

const StatCard = ({ icon, label, value }) => (
    <div className="bg-card border-2 border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gold-solid/10 rounded-lg flex items-center justify-center">{icon}</div>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <p className="text-3xl font-bold text-gold-solid">{value}</p>
    </div>
)

const WorkflowProgress = ({ steps }) => (
    <div className="bg-card border-2 border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Workflow Progress</h3>
        <div className="space-y-3">
            {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.completed ? 'bg-green-500' : 'bg-muted'}`}>
                        {step.completed && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <p className="text-sm text-foreground">{`Step ${idx + 1}: ${step.label}`}</p>
                </div>
            ))}
        </div>
    </div>
)

const SelectionSection = ({ title, icon, selected, uploadedImages }) => (
    <div className="border-t border-border pt-6 first:border-t-0 first:pt-0">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gold-solid/10 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>

        {/* Selected Items */}
        {selected.length > 0 && (
            <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Selected {title}:</p>
                <div className="flex flex-wrap gap-2">
                    {selected.map((item, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gold-solid/10 text-gold-solid rounded-full text-sm">
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* Uploaded Images */}
        {uploadedImages.length > 0 && (
            <div>
                <p className="text-sm text-muted-foreground mb-2">Uploaded {title} Images:</p>
                <div className="grid grid-cols-4 gap-4">
                    {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative w-full h-24 rounded-lg border border-border overflow-hidden">
                            <Image
                                src={img.cloud_url || img.local_url}
                                alt={`${title} ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 25vw, 25vw"
                            />
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
)

const GenerationStatCard = ({ label, value, icon }) => (
    <div className="bg-muted border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gold-solid/10 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <p className="text-2xl font-bold text-gold-solid">{value}</p>
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
)
