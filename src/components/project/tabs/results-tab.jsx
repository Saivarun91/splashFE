"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Download, Image as ImageIcon, Calendar, Clock, ChevronLeft, ChevronRight, Box, User, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductImagesDisplay } from "../product-images-display"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { dataCache, cacheKeys } from "@/lib/data-cache"

export default function ResultsTab({ project }) {

    const [collectionData, setCollectionData] = useState(null)
    const [loading, setLoading] = useState(true)
    // Don't initialize with 0 - use null to indicate "not loaded yet"
    const [stats, setStats] = useState(null)
    const [modelStats, setModelStats] = useState(null)
    const [historyData, setHistoryData] = useState(null)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [imageFilter, setImageFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const imagesPerPage = 12
    const { token } = useAuth()

    const loadData = async () => {
        if (!project?.collection?.id || !token) return;

        setLoading(true);
        try {
            // Try cache first for instant display
            const collectionCacheKey = cacheKeys.collection(project.collection.id);
            const modelStatsCacheKey = cacheKeys.modelStats(project.collection.id);
            const historyCacheKey = cacheKeys.collectionHistory(project.collection.id);
            
            const cachedCollection = dataCache.get(collectionCacheKey);
            const cachedModelStats = dataCache.get(modelStatsCacheKey);
            const cachedHistory = dataCache.get(historyCacheKey);
            
            if (cachedCollection) {
                setCollectionData(cachedCollection);
                
                // Calculate stats from cached collection
                if (cachedCollection?.items?.[0]) {
                    const item = cachedCollection.items[0];
                    const products = item.product_images || [];
                    const totalGenerated = products.reduce(
                        (sum, p) => sum + (p.generated_images?.length || 0),
                        0
                    );

                    const completionSteps = [
                        cachedCollection.description ? 1 : 0,
                        item.selected_model ? 1 : 0,
                        products.length > 0 ? 1 : 0,
                        totalGenerated > 0 ? 1 : 0
                    ].reduce((a, b) => a + b, 0);

                    setStats({
                        totalImages: totalGenerated,
                        products: products.length,
                        variations: products.length > 0 ? Math.floor(totalGenerated / products.length) : 0,
                        completion: Math.floor((completionSteps / 4) * 100)
                    });
                }
                
                if (cachedModelStats) {
                    setModelStats(cachedModelStats);
                } else {
                    // Set default model stats if not cached
                    setModelStats({
                        total_models_used: 0,
                        models_breakdown: [],
                        total_generations: 0
                    });
                }
                
                if (cachedHistory) {
                    setHistoryData(cachedHistory);
                }
                
                // Don't set loading to false here - let fresh data update it
                // This ensures we show cached data instantly but still fetch fresh data
            }

            // Fetch all data in parallel with caching for better performance
            const [dataResult, modelUsageResult, historyResult] = await Promise.allSettled([
                dataCache.getOrFetch(
                    collectionCacheKey,
                    () => apiService.getCollection(project.collection.id, token),
                    2 * 60 * 1000
                ),
                dataCache.getOrFetch(
                    modelStatsCacheKey,
                    () => apiService.getModelUsageStats(project.collection.id, token).then(r => r.success ? r : null),
                    2 * 60 * 1000
                ).catch(() => null),
                dataCache.getOrFetch(
                    historyCacheKey,
                    () => apiService.getCollectionHistory(project.collection.id, token).then(r => r.success ? r : null),
                    2 * 60 * 1000
                ).catch(() => null)
            ]);

            // Process collection data
            if (dataResult.status === 'fulfilled') {
                const data = dataResult.value;
                setCollectionData(data);

                // Calculate stats
                if (data?.items?.[0]) {
                    const item = data.items[0];
                    const products = item.product_images || [];
                    const totalGenerated = products.reduce(
                        (sum, p) => sum + (p.generated_images?.length || 0),
                        0
                    );

                    const completionSteps = [
                        data.description ? 1 : 0,
                        item.selected_model ? 1 : 0,
                        products.length > 0 ? 1 : 0,
                        totalGenerated > 0 ? 1 : 0
                    ].reduce((a, b) => a + b, 0);

                    setStats({
                        totalImages: totalGenerated,
                        products: products.length,
                        variations: products.length > 0 ? Math.floor(totalGenerated / products.length) : 0,
                        completion: Math.floor((completionSteps / 4) * 100)
                    });
                } else {
                    // No data - set to 0 explicitly (not null)
                    setStats({
                        totalImages: 0,
                        products: 0,
                        variations: 0,
                        completion: 0
                    });
                }
            }

            // Process model usage statistics
            if (modelUsageResult.status === 'fulfilled' && modelUsageResult.value?.success) {
                setModelStats({
                    total_models_used: modelUsageResult.value.total_models_used || 0,
                    models_breakdown: modelUsageResult.value.models_breakdown || [],
                    total_generations: modelUsageResult.value.total_generations || 0
                });
            } else {
                // No model stats - set to 0 explicitly
                setModelStats({
                    total_models_used: 0,
                    models_breakdown: [],
                    total_generations: 0
                });
            }

            // Process history data
            setHistoryLoading(true);
            if (historyResult.status === 'fulfilled' && historyResult.value?.success) {
                const historyResponse = historyResult.value;
                const historyProjectId = historyResponse.project_id;
                const currentProjectId = project?.id;

                if (historyProjectId && currentProjectId && historyProjectId === currentProjectId) {
                    setHistoryData(historyResponse);
                } else if (!historyProjectId && historyResponse.collection_id === project.collection.id) {
                    setHistoryData(historyResponse);
                } else {
                    setHistoryData(null);
                }
            } else {
                setHistoryData(null);
            }
            setHistoryLoading(false);
            
            // Cache successful results
            if (dataResult.status === 'fulfilled') {
                dataCache.set(collectionCacheKey, dataResult.value, 2 * 60 * 1000);
            }
            if (modelUsageResult.status === 'fulfilled' && modelUsageResult.value?.success) {
                dataCache.set(modelStatsCacheKey, modelUsageResult.value, 2 * 60 * 1000);
            }
            if (historyResult.status === 'fulfilled' && historyResult.value?.success) {
                dataCache.set(historyCacheKey, historyResult.value, 2 * 60 * 1000);
            }
        } catch (err) {
            console.error("Error loading results:", err);
            // Set defaults on error
            setStats({
                totalImages: 0,
                products: 0,
                variations: 0,
                completion: 0
            });
            setModelStats({
                total_models_used: 0,
                models_breakdown: [],
                total_generations: 0
            });
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadData()
    }, [project?.collection?.id, project?.id, token])

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [imageFilter])

    // Collect all generated images from history
    const allGeneratedImages = useMemo(() => {
        if (!historyData?.history_by_product) return [];
        
        const images = [];
        historyData.history_by_product.forEach((productHistory) => {
            productHistory.history.forEach((historyItem) => {
                if (historyItem.image_url) {
                    images.push({
                        id: historyItem.id,
                        image_url: historyItem.image_url,
                        image_type: historyItem.image_type,
                        created_at: historyItem.created_at,
                        parent_image_id: historyItem.parent_image_id
                    });
                }
            });
        });
        
        return images;
    }, [historyData]);

    // Filter images by type
    const filteredImages = useMemo(() => {
        if (imageFilter === 'all') {
            return allGeneratedImages;
        }
        
        const filterMap = {
            'white_background': ['project_white_background'],
            'background_replace': ['project_background_replace'],
            'model_image': ['project_model_image', 'project_ai_model_generation'],
            'campaign_image': ['project_campaign_image']
        };
        
        const allowedTypes = filterMap[imageFilter] || [];
        return allGeneratedImages.filter(img => allowedTypes.includes(img.image_type));
    }, [allGeneratedImages, imageFilter]);

    // Paginate images
    const paginatedImages = useMemo(() => {
        const startIndex = (currentPage - 1) * imagesPerPage;
        const endIndex = startIndex + imagesPerPage;
        return filteredImages.slice(startIndex, endIndex);
    }, [filteredImages, currentPage]);

    const totalPages = Math.ceil(filteredImages.length / imagesPerPage);

    const getImageTypeLabel = (imageType) => {
        switch (imageType) {
            case 'project_white_background':
                return 'White Background';
            case 'project_background_replace':
                return 'Background Replace';
            case 'project_model_image':
                return 'Model Image';
            case 'project_campaign_image':
                return 'Campaign Image';
            case 'project_ai_model_generation':
                return 'AI Model Generated';
            case 'project_model_selection':
                return 'Model Selected';
            case 'project_product_upload':
                return 'Product Uploaded';
            default:
                return imageType?.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Generated';
        }
    };

    const downloadImageAsBlob = async (imageUrl, filename) => {
        try {
            // Fetch the image as a blob with no-cors mode if needed
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

    const sanitizePathSegment = (value) => {
        return String(value || "unknown")
            .trim()
            .replace(/[<>:"/\\|?*]+/g, "-")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase() || "unknown";
    };

    const guessExtension = (url, contentType) => {
        if (contentType) {
            if (contentType.includes("png")) return "png";
            if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
            if (contentType.includes("webp")) return "webp";
            if (contentType.includes("gif")) return "gif";
        }
        const cleanUrl = String(url || "").split("?")[0];
        const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
        return match?.[1]?.toLowerCase() || "png";
    };

    const createZipBlob = async (images) => {
        const zip = new window.JSZip();
        const usedPaths = new Set();

        for (const image of images) {
            if (!image?.url) continue;
            try {
                const response = await fetch(image.url, { mode: "cors", cache: "no-cache" });
                if (!response.ok) {
                    console.error(`Skipping image (HTTP ${response.status}):`, image.url);
                    continue;
                }
                const blob = await response.blob();
                const extension = guessExtension(image.url, blob.type);
                const folderName = sanitizePathSegment(
                    image.folderName || getImageTypeLabel(image.type) || "generated"
                );

                let baseFileName = sanitizePathSegment(
                    image.fileName ||
                    `product-${image.productIndex || "x"}-image-${image.imageIndex || Date.now()}`
                );
                if (!baseFileName.endsWith(`.${extension}`)) {
                    baseFileName = `${baseFileName}.${extension}`;
                }

                let fullPath = `${folderName}/${baseFileName}`;
                let duplicateCounter = 1;
                while (usedPaths.has(fullPath)) {
                    const withoutExt = baseFileName.replace(new RegExp(`\\.${extension}$`), "");
                    fullPath = `${folderName}/${withoutExt}-${duplicateCounter}.${extension}`;
                    duplicateCounter += 1;
                }

                usedPaths.add(fullPath);
                zip.file(fullPath, blob);
            } catch (error) {
                console.error("Skipping image while creating zip:", image.url, error);
            }
        }

        return zip.generateAsync({ type: "blob" });
    };

    const downloadZipFromImages = async (images, zipNamePrefix = "generated-images") => {
        if (!images.length) return;
        if (!window.JSZip) {
            const { default: JSZip } = await import("jszip");
            window.JSZip = JSZip;
        }

        const zipBlob = await createZipBlob(images);
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        const zipUrl = window.URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.href = zipUrl;
        link.download = `${sanitizePathSegment(zipNamePrefix)}-${timestamp}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(zipUrl);
    };

    const handleDownloadImage = async (imageUrl, imageType, productIndex, imageIndex = null, isHistory = false) => {
        // Generate filename based on context
        let filename;
        if (isHistory) {
            const imageTypeLabel = getImageTypeLabel(imageType).toLowerCase().replace(/\s+/g, '-');
            const timestamp = Date.now();
            filename = `product-${productIndex}-${imageTypeLabel}-${timestamp}.png`;
        } else {
            const imageTypeLabel = imageType?.replace(/_/g, '-') || 'generated';
            filename = `product-${productIndex}-${imageTypeLabel}${imageIndex !== null ? `-${imageIndex}` : ''}.png`;
        }

        await downloadImageAsBlob(imageUrl, filename);
    }

    const handleDownloadAll = async () => {
        if (isDownloading) {
            return;
        }

        setIsDownloading(true);
        const imagesToDownload = [];

        // Collect images from current collection data
        if (collectionData?.items?.[0]?.product_images) {
            collectionData.items[0].product_images.forEach((product, pIdx) => {
                product.generated_images?.forEach((img, iIdx) => {
                    // Add original image
                    if (img.cloud_url) {
                        imagesToDownload.push({
                            url: img.cloud_url,
                            type: img.type,
                            productIndex: pIdx + 1,
                            imageIndex: iIdx + 1,
                            version: 0
                        });
                    }
                    // Add regenerated images
                    if (img.regenerated_images) {
                        img.regenerated_images.forEach((regen, rIdx) => {
                            if (regen.cloud_url) {
                                imagesToDownload.push({
                                    url: regen.cloud_url,
                                    type: regen.type || img.type,
                                    productIndex: pIdx + 1,
                                    imageIndex: iIdx + 1,
                                    version: rIdx + 1
                                });
                            }
                        });
                    }
                    // Add enhanced images
                    if (img.enhanced_images) {
                        img.enhanced_images.forEach((enhanced, eIdx) => {
                            if (enhanced.cloud_url) {
                                imagesToDownload.push({
                                    url: enhanced.cloud_url,
                                    type: 'enhanced',
                                    productIndex: pIdx + 1,
                                    imageIndex: iIdx + 1,
                                    version: `enhanced-${eIdx + 1}`
                                });
                            }
                        });
                    }
                });
            });
        }

        // Collect images from history data
        if (historyData?.history_by_product) {
            historyData.history_by_product.forEach((productHistory, pIdx) => {
                productHistory.history.forEach((historyItem, hIdx) => {
                    if (historyItem.image_url) {
                        imagesToDownload.push({
                            url: historyItem.image_url,
                            type: historyItem.image_type,
                            productIndex: pIdx + 1,
                            imageIndex: hIdx + 1,
                            version: 'history',
                            isHistory: true
                        });
                    }
                });
            });
        }

        if (imagesToDownload.length === 0) {
            setIsDownloading(false);
            return;
        }

        try {
            const zipImages = imagesToDownload.map((image) => {
                const imageTypeLabel = sanitizePathSegment(getImageTypeLabel(image.type));
                const folderName = image.isHistory ? `history/${imageTypeLabel}` : `generated/${imageTypeLabel}`;
                const fileName = image.isHistory
                    ? `product-${image.productIndex}-history-${image.imageIndex}`
                    : `product-${image.productIndex}-image-${image.imageIndex}${image.version ? `-v${image.version}` : ""}`;
                return {
                    ...image,
                    folderName,
                    fileName,
                };
            });

            await downloadZipFromImages(zipImages, `${project?.name || "project"}-all-images`);
        } catch (error) {
            console.error("Failed to create zip for all images:", error);
        } finally {
            setIsDownloading(false);
        }
    }

    const handleDownloadAllHistory = async () => {
        if (!historyData?.history_by_product) return;
        if (isDownloading) {
            return;
        }

        setIsDownloading(true);
        const imagesToDownload = [];

        historyData.history_by_product.forEach((productHistory, pIdx) => {
            productHistory.history.forEach((historyItem, hIdx) => {
                if (historyItem.image_url) {
                    imagesToDownload.push({
                        url: historyItem.image_url,
                        type: historyItem.image_type,
                        productIndex: pIdx + 1,
                        imageIndex: hIdx + 1
                    });
                }
            });
        });

        if (imagesToDownload.length === 0) {
            setIsDownloading(false);
            return;
        }

        try {
            const zipImages = imagesToDownload.map((image) => ({
                ...image,
                folderName: `history/${sanitizePathSegment(getImageTypeLabel(image.type))}`,
                fileName: `product-${image.productIndex}-history-${image.imageIndex}`,
            }));
            await downloadZipFromImages(zipImages, `${project?.name || "project"}-history-images`);
        } catch (error) {
            console.error("Failed to create zip for history images:", error);
        } finally {
            setIsDownloading(false);
        }
    }

    // Show skeleton only if no cached data - never block with spinner
    // Don't show 0 values - show skeletons until data is loaded
    const isLoading = loading && !collectionData && !stats && !modelStats;
    
    // Only show stats if data is loaded (not null)
    const hasResults = stats?.totalImages > 0 || false

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} hours ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
    };

    const formatDetailedDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div>
            {/* Stats Cards - Show skeletons until data loads (never show 0 values) */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {isLoading ? (
                    // Show skeleton loaders instead of 0 values
                    <>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white border-2 border-[#e6e6e6] rounded-lg p-6 animate-pulse">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                            </div>
                        ))}
                    </>
                ) : (
                    // Show actual stats only when data is loaded
                    <>
                        <div className="bg-white border-2 border-[#e6e6e6] rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-[#884cff]/10 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-[#884cff]" />
                                </div>
                                <p className="text-sm text-[#708090]">Total Images</p>
                            </div>
                            <p className="text-3xl font-bold text-[#884cff]">{modelStats?.total_generations ?? 0}</p>
                        </div>

                        <div className="bg-white border-2 border-[#e6e6e6] rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-[#884cff]/10 rounded-lg flex items-center justify-center">
                                    <span className="text-xl"><Box className="w-5 h-5 text-[#884cff]" /></span>
                                </div>
                                <p className="text-sm text-[#708090]">Products</p>
                            </div>
                            <p className="text-3xl font-bold text-[#884cff]">{stats?.products ?? 0}</p>
                        </div>

                        <div className="bg-white border-2 border-[#e6e6e6] rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-[#884cff]/10 rounded-lg flex items-center justify-center">
                                    <span className="text-xl"><User className="w-5 h-5 text-[#884cff]" /></span>
                                </div>
                                <p className="text-sm text-[#708090]">Total Models Used</p>
                            </div>
                            <p className="text-3xl font-bold text-[#884cff]">{modelStats?.total_models_used ?? 0}</p>
                        </div>

                        <div className="bg-white border-2 border-[#e6e6e6] rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-[#884cff]/10 rounded-lg flex items-center justify-center">
                                    <span className="text-xl"><CheckCircle className="w-5 h-5 text-[#884cff]" /></span>
                                </div>
                                <p className="text-sm text-[#708090]">Completion</p>
                            </div>
                            <p className="text-3xl font-bold text-[#884cff]">{stats?.completion ?? 0}%</p>
                        </div>
                    </>
                )}
            </div>



            {/* Action Bar */}
            {(hasResults || (historyData?.history_by_product?.length > 0)) && (
                <div className="flex items-center justify-between mb-6 p-4 bg-white border-2 border-[#e6e6e6] rounded-lg">
                    <div>
                        <h3 className="font-semibold text-[#1a1a1a]">All Generated Images</h3>
                        <p className="text-sm text-[#708090]">
                            View and download all your generated product images {historyData?.history_by_product?.length > 0 && '(including history)'}
                        </p>
                    </div>
                    <Button
                        className="bg-[#884cff] hover:bg-[#7a3ff0] text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleDownloadAll}
                        disabled={isDownloading}
                    >
                        <Download className="w-4 h-4" />
                        {isDownloading ? 'Downloading...' : 'Download All'}
                    </Button>
                </div>
            )}

            {/* Model Usage Statistics */}


            {/* Product Images Display */}
            {loading && !collectionData ? (
                // Show skeleton loaders while images are loading
                <div className="mb-12 space-y-8">
                    {/* Header Skeleton */}
                    <div className="flex items-center justify-between mb-8 animate-pulse">
                        <div className="space-y-2">
                            <div className="h-7 bg-gray-200 rounded w-64"></div>
                            <div className="h-4 bg-gray-200 rounded w-80"></div>
                        </div>
                        <div className="h-10 w-32 bg-gray-200 rounded-full"></div>
                    </div>
                    
                    {/* Product Sections Skeleton - Matching ProductImagesDisplay structure */}
                    {Array.from({ length: 2 }).map((_, productIdx) => (
                        <div key={productIdx} className="bg-white border-2 border-[#e6e6e6] rounded-xl p-6 space-y-4 animate-pulse">
                            {/* Product Header Skeleton */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-gray-200 rounded w-48"></div>
                                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                                </div>
                            </div>
                            
                            {/* Images Grid Skeleton - Matching ProductImagesDisplay grid layout */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {Array.from({ length: 5 }).map((_, imgIdx) => (
                                    <div key={imgIdx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                        <div className="w-full h-full bg-gray-200"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : hasResults ? (
                <ProductImagesDisplay
                    project={project}
                    collectionData={collectionData}
                    showRegenerate={true}
                    onRegenerateSuccess={loadData}
                />
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-[#e6e6e6] rounded-lg">
                    <ImageIcon className="w-16 h-16 text-[#708090] mx-auto mb-4" />
                    <p className="text-[#708090] mb-2">No results yet</p>
                    <p className="text-sm text-[#708090]">
                        Complete the workflow to generate your product images
                    </p>
                </div>
            )}

            {/* Generation History Section - Images Grid */}
            {allGeneratedImages.length > 0 && (
                <div className="mt-12">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-6 h-6 text-[#884cff]" />
                                <div>
                                    <h2 className="text-2xl font-bold text-[#1a1a1a]">Previously Generated Images</h2>
                                    {historyData?.project_name && (
                                        <p className="text-sm text-[#708090] mt-1">
                                            Project: <span className="font-medium text-[#884cff]">{historyData.project_name}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button
                                className="bg-[#884cff] hover:bg-[#7a3ff0] text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleDownloadAllHistory}
                                disabled={isDownloading}
                            >
                                <Download className="w-4 h-4" />
                                {isDownloading ? 'Downloading...' : 'Download All'}
                            </Button>
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex items-center gap-3 mb-6">
                            <button
                                onClick={() => {
                                    setImageFilter('all');
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    imageFilter === 'all'
                                        ? 'bg-[#884cff] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => {
                                    setImageFilter('white_background');
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    imageFilter === 'white_background'
                                        ? 'bg-[#884cff] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                White Background
                            </button>
                            <button
                                onClick={() => {
                                    setImageFilter('background_replace');
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    imageFilter === 'background_replace'
                                        ? 'bg-[#884cff] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Background Replace
                            </button>
                            <button
                                onClick={() => {
                                    setImageFilter('model_image');
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    imageFilter === 'model_image'
                                        ? 'bg-[#884cff] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Model Image
                            </button>
                            <button
                                onClick={() => {
                                    setImageFilter('campaign_image');
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    imageFilter === 'campaign_image'
                                        ? 'bg-[#884cff] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Campaign Image
                            </button>
                        </div>

                        {/* Images Grid - 4 columns */}
                        {paginatedImages.length > 0 ? (
                            <>
                                <div className="grid grid-cols-4 gap-4 mb-6">
                                    {paginatedImages.map((image, index) => (
                                        <div key={image.id || index} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                            <Image
                                                src={image.image_url}
                                                alt="Generated"
                                                fill
                                                className="object-cover cursor-pointer"
                                                onClick={() => window.open(image.image_url, "_blank")}
                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                unoptimized={image.image_url?.includes('cloudinary') || image.image_url?.includes('imagekit') || image.image_url?.includes('localhost') || image.image_url?.includes('127.0.0.1') || image.image_url?.startsWith('/media')}
                                            />
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                                {/* Top Badge */}
                                                <div className="flex justify-between items-start">
                                                    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                                                        {getImageTypeLabel(image.image_type)}
                                                    </div>
                                                    {image.parent_image_id && (
                                                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                                            Regenerated
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Bottom Actions */}
                                                <div className="flex gap-2 justify-center">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="gap-1 text-xs px-2 py-1 h-auto bg-white/90 backdrop-blur-sm hover:bg-white"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(image.image_url, "_blank");
                                                        }}
                                                    >
                                                        <ImageIcon className="w-3 h-3" /> View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="gap-1 text-xs px-2 py-1 h-auto bg-white/90 backdrop-blur-sm hover:bg-white"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const globalIndex = (currentPage - 1) * imagesPerPage + index;
                                                            handleDownloadImage(
                                                                image.image_url,
                                                                image.image_type,
                                                                Math.floor(globalIndex / 4) + 1,
                                                                (globalIndex % 4) + 1,
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        <Download className="w-3 h-3" /> Save
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-4 mt-6">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="gap-2"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </Button>
                                        <span className="text-sm text-gray-700 font-medium">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="gap-2"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}

                                {/* Results Count */}
                                <div className="text-center mt-4 text-sm text-gray-500">
                                    Showing {paginatedImages.length} of {filteredImages.length} images
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                                <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-2">No images found</p>
                                <p className="text-sm text-gray-500">
                                    {imageFilter !== 'all' ? 'Try a different filter' : 'No generated images available'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {historyLoading && (
                <div className="mt-12">
                    <div className="grid grid-cols-4 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="aspect-square bg-gray-100 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
