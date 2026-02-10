"use client"

import React, { useState, useEffect, useRef, useImperativeHandle } from "react"
import { Upload, X, CheckCircle, Image as ImageIcon, Eye, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { HierarchicalOrnamentSelect } from "./hierarchical-ornament-select"
const MAX_IMAGE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];


export const ProductUploadPage = React.forwardRef(({ project, collectionData, onSave, canEdit = true }, ref) => {
    const [selectedFiles, setSelectedFiles] = useState([])
    const [uploadError, setUploadError] = useState(null);

    const [fileOrnamentTypes, setFileOrnamentTypes] = useState({}) // Map file index to ornament type
    const [filePreviews, setFilePreviews] = useState({}) // Map file index to preview URL
    const [uploadedProducts, setUploadedProducts] = useState([])
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)
    const { token } = useAuth()
    
    // Selection state: { productIndex: { plainBg: boolean, bgReplace: boolean, model: boolean, campaign: boolean } }
    const [selections, setSelections] = useState({})
    
    // Column header selection state
    const [columnSelections, setColumnSelections] = useState({
        plainBg: false,
        bgReplace: false,
        model: false,
        campaign: false
    })

    // Credit settings state
    const [creditSettings, setCreditSettings] = useState({
        credits_per_image_generation: 2 // Default fallback
    })

    // Fetch credit settings
    useEffect(() => {
        const fetchCreditSettings = async () => {
            try {
                const response = await apiService.getCreditSettings()
                if (response?.success && response?.settings) {
                    setCreditSettings(response.settings)
                }
            } catch (error) {
                console.error('Failed to fetch credit settings:', error)
                // Keep default value
            }
        }
        fetchCreditSettings()
    }, [])

    // Load existing product images from collection data
    useEffect(() => {
        if (collectionData?.items?.[0]?.product_images) {
            const existing = collectionData.items[0].product_images
            setUploadedProducts(existing)
            // Initialize selections from backend or default to false
            const initialSelections = {}
            existing.forEach((product, index) => {
                if (product.generation_selections) {
                    // Use saved selections from backend
                    initialSelections[index] = {
                        plainBg: product.generation_selections.plainBg || false,
                        bgReplace: product.generation_selections.bgReplace || false,
                        model: product.generation_selections.model || false,
                        campaign: product.generation_selections.campaign || false
                    }
                } else {
                    // Default to false if no selections saved
                    initialSelections[index] = {
                        plainBg: false,
                        bgReplace: false,
                        model: false,
                        campaign: false
                    }
                }
            })
            setSelections(initialSelections)
        }
    }, [collectionData])
    
    // Update column selections based on individual selections
    useEffect(() => {
        const productCount = uploadedProducts.length
        if (productCount === 0) {
            setColumnSelections({ plainBg: false, bgReplace: false, model: false, campaign: false })
            return
        }
        
        const newColumnSelections = {
            plainBg: Object.values(selections).every(s => s.plainBg),
            bgReplace: Object.values(selections).every(s => s.bgReplace),
            model: Object.values(selections).every(s => s.model),
            campaign: Object.values(selections).every(s => s.campaign)
        }
        setColumnSelections(newColumnSelections)
    }, [selections, uploadedProducts.length])

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setUploadError(null);
      
        if (!files.length) return;
      
        for (const file of files) {
          if (file.size > MAX_IMAGE_BYTES) {
            setUploadError("File size exceeded. Max 10MB allowed per image.");
            e.target.value = "";
            return;
          }
      
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setUploadError("Only JPG, PNG or WEBP images are allowed.");
            e.target.value = "";
            return;
          }
        }
      
        const newFiles = [...selectedFiles, ...files];
        setSelectedFiles(newFiles);
      
        const newPreviews = { ...filePreviews };
        files.forEach((file, fileIndex) => {
          const actualIndex = selectedFiles.length + fileIndex;
          newPreviews[actualIndex] = URL.createObjectURL(file);
        });
        setFilePreviews(newPreviews);
      
        // allow reselect same file
        e.target.value = "";
      };
      

    const handleRemoveFile = (index) => {
        // Clean up preview URL
        if (filePreviews[index]) {
            URL.revokeObjectURL(filePreviews[index])
        }

        // Remove file and reindex everything
        setSelectedFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index)
            return newFiles
        })

        // Reindex previews and ornament types
        setFilePreviews(prev => {
            const newPreviews = {}
            Object.keys(prev).forEach(key => {
                const keyNum = parseInt(key)
                if (keyNum < index) {
                    newPreviews[keyNum] = prev[key]
                } else if (keyNum > index) {
                    newPreviews[keyNum - 1] = prev[key]
                }
                // Skip the deleted index
            })
            return newPreviews
        })

        setFileOrnamentTypes(prev => {
            const newTypes = {}
            Object.keys(prev).forEach(key => {
                const keyNum = parseInt(key)
                if (keyNum < index) {
                    newTypes[keyNum] = prev[key]
                } else if (keyNum > index) {
                    newTypes[keyNum - 1] = prev[key]
                }
                // Skip the deleted index
            })
            return newTypes
        })
    }

    const handleOrnamentTypeChange = (fileIndex, ornamentType) => {
        setFileOrnamentTypes(prev => ({
            ...prev,
            [fileIndex]: ornamentType
        }))
    }

    // Clean up preview URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(filePreviews).forEach(url => {
                if (url) URL.revokeObjectURL(url)
            })
        }
    }, [filePreviews])

    const handleDeleteProduct = async (product) => {
        if (!window.confirm("Are you sure you want to delete this product image?")) return

        setDeleting(true)
        setError(null)

        try {
            const response = await apiService.deleteProductImage(
                collectionData.id,
                product.uploaded_image_url,
                product.uploaded_image_path,
                token
            )

            if (response.success) {
                // Refresh collection data to get updated products
                const updatedCollection = await apiService.getCollection(collectionData.id, token)
                if (updatedCollection.items?.[0]?.product_images) {
                    setUploadedProducts(updatedCollection.items[0].product_images)
                }
                // Notify parent component
                if (onSave) {
                    await onSave({ productsUpdated: true })
                }
            } else {
                setError(response.error || "Failed to delete product image.")
            }
        } catch (err) {
            console.error("Error deleting product image:", err)
            setError(err.message || "Failed to delete product image.")
        } finally {
            setDeleting(false)
        }
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one image')
            return
        }

        if (!collectionData?.id) {
            setError('No collection found')
            return
        }

        // Check if all files have ornament types selected
        const missingTypes = selectedFiles.filter((_, index) => !fileOrnamentTypes[index])
        if (missingTypes.length > 0) {
            setError('Please select ornament type for all files')
            return
        }

        setUploading(true)
        setError(null)

        try {
            // Prepare ornament types array matching the files order
            const ornamentTypes = selectedFiles.map((_, index) => fileOrnamentTypes[index] || '')

            const response = await apiService.uploadProductImages(
                collectionData.id,
                selectedFiles,
                ornamentTypes,
                token
            )

            if (response.success) {
                // Clean up preview URLs
                Object.values(filePreviews).forEach(url => {
                    if (url) URL.revokeObjectURL(url)
                })

                // Refresh collection data to get uploaded products
                const updatedCollection = await apiService.getCollection(collectionData.id, token)
                if (updatedCollection.items?.[0]?.product_images) {
                    setUploadedProducts(updatedCollection.items[0].product_images)
                }

                setSelectedFiles([])
                setFilePreviews({})
                setFileOrnamentTypes({})
                if (onSave) {
                    await onSave({ productsUploaded: true })
                }
            } else {
                setError(response.error || 'Failed to upload products')
            }
        } catch (err) {
            console.error('Error uploading products:', err)
            setError(err.message || 'Failed to upload products')
        } finally {
            setUploading(false)
        }
    }

    // Function to save selections to backend (called manually when user clicks "Save and Continue")
    const saveSelections = async () => {
        if (!collectionData?.id || !token || Object.keys(selections).length === 0) {
            return { success: true } // Nothing to save
        }

        try {
            await apiService.updateProductGenerationSelections(
                collectionData.id,
                selections,
                token
            )
            // Refresh collection data to get updated selections
            const updatedCollection = await apiService.getCollection(collectionData.id, token)
            if (updatedCollection.items?.[0]?.product_images) {
                setUploadedProducts(updatedCollection.items[0].product_images)
            }
            return { success: true }
        } catch (err) {
            console.error("Error saving generation selections:", err)
            return { success: false, error: err.message }
        }
    }

    // Expose selections and save function to parent component via ref
    useImperativeHandle(ref, () => ({
        getSelections: () => selections,
        saveSelections: saveSelections
    }))

    const hasProducts = uploadedProducts.length > 0
    const hasSelectedFiles = selectedFiles.length > 0

    return (
        <div className="mb-12">
            <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 bg-[#e6e6e6] rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-[#708090]" />
                </div>
                <div>
                    <h3 className="font-bold text-[#1a1a1a] text-2xl">Product Upload</h3>
                    <p className="text-sm text-[#708090] mt-1">Upload product images with white or transparent background</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Upload Area */}
            {uploadError && (
  <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
    <X className="w-4 h-4" />
    {uploadError}
  </div>
)}

            <div
  className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-all ${
    uploadError
      ? "border-red-500 bg-red-50"
      : "border-[#b0bec5]"
  }`}
>

                <div className="text-center">
                    <Upload className="w-16 h-16 text-[#708090] mx-auto mb-4" />
                    <h4 className="font-semibold text-[#1a1a1a] mb-2">Upload Product Images</h4>
                    <p className="text-sm text-[#708090] mb-4">
                        Select one or more product images (PNG, JPG)
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={!canEdit}
                    />

                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="mb-4"
                        disabled={!canEdit}
                        title={canEdit ? "" : "You need Editor or Owner role to upload products"}
                    >
                        Choose Files
                    </Button>

                    {hasSelectedFiles && (
                        <div className="mt-6">
                            <p className="text-sm font-medium text-[#1a1a1a] mb-4">Selected Files Preview:</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="bg-white border border-[#e6e6e6] rounded-lg p-3 space-y-3 relative group hover:border-[#884cff]/50 transition-all"
                                    >
                                        {/* Remove Button */}
                                        <button
                                            onClick={() => handleRemoveFile(index)}
                                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            disabled={!canEdit}
                                            title="Remove file"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>

                                        {/* File Preview - At Top */}
                                        <div className="w-full aspect-square bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                            {filePreviews[index] ? (
                                                <img
                                                    src={filePreviews[index]}
                                                    alt={file.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* File Name - Below Preview */}
                                        <div>
                                            <p className="text-xs font-medium text-[#1a1a1a] truncate" title={file.name}>
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-[#708090] mt-0.5">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>

                                        {/* Ornament Type Selection - Below File Name */}
                                        <div>
                                            <label className="block text-xs font-medium text-[#1a1a1a] mb-1.5">
                                                Ornament Type <span className="text-red-500">*</span>
                                            </label>
                                            <HierarchicalOrnamentSelect
                                                selectedType={fileOrnamentTypes[index] || ''}
                                                onTypeChange={(type) => handleOrnamentTypeChange(index, type)}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={uploading || !canEdit || selectedFiles.some((_, index) => !fileOrnamentTypes[index])}
                                className="bg-[#884cff] hover:bg-[#7a3ff0] text-white w-full"
                                title={canEdit ? "" : "You need Editor or Owner role to upload products"}
                            >
                                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Generation Selection Table */}
            {hasProducts && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h4 className="font-semibold text-[#1a1a1a] text-lg">
                                Select Images to Generate ({uploadedProducts.length} {uploadedProducts.length === 1 ? 'Product' : 'Products'})
                            </h4>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => {
                                    const allSelected = {
                                        plainBg: true,
                                        bgReplace: true,
                                        model: true,
                                        campaign: true
                                    }
                                    const newSelections = {}
                                    uploadedProducts.forEach((_, index) => {
                                        newSelections[index] = { ...allSelected }
                                    })
                                    setSelections(newSelections)
                                    setColumnSelections(allSelected)
                                }}
                                variant="outline"
                                className="flex items-center gap-2 border-[#884cff] text-[#884cff] hover:bg-[#884cff] hover:text-white"
                                disabled={!canEdit}
                            >
                                <CheckSquare className="w-4 h-4" />
                                Select All
                            </Button>
                            <Button
                                onClick={() => {
                                    const allUnselected = {
                                        plainBg: false,
                                        bgReplace: false,
                                        model: false,
                                        campaign: false
                                    }
                                    const newSelections = {}
                                    uploadedProducts.forEach((_, index) => {
                                        newSelections[index] = { ...allUnselected }
                                    })
                                    setSelections(newSelections)
                                    setColumnSelections(allUnselected)
                                }}
                                variant="outline"
                                className="flex items-center gap-2 border-gray-300 text-gray-600 hover:bg-gray-100"
                                disabled={!canEdit}
                            >
                                <Square className="w-4 h-4" />
                                Clear All
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-[#e6e6e6] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-gray-50 border-b border-[#e6e6e6]">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-[#1a1a1a] min-w-[200px]">
                                            Uploaded Product
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[#1a1a1a] min-w-[150px]">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        const newValue = !columnSelections.plainBg
                                                        setColumnSelections(prev => ({ ...prev, plainBg: newValue }))
                                                        const newSelections = { ...selections }
                                                        uploadedProducts.forEach((_, index) => {
                                                            if (!newSelections[index]) {
                                                                newSelections[index] = { plainBg: false, bgReplace: false, model: false, campaign: false }
                                                            }
                                                            newSelections[index].plainBg = newValue
                                                        })
                                                        setSelections(newSelections)
                                                    }}
                                                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                                                    disabled={!canEdit}
                                                >
                                                    {columnSelections.plainBg ? (
                                                        <CheckSquare className="w-5 h-5 text-[#884cff]" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                                <span>Plain BG Image</span>
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[#1a1a1a] min-w-[150px]">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        const newValue = !columnSelections.bgReplace
                                                        setColumnSelections(prev => ({ ...prev, bgReplace: newValue }))
                                                        const newSelections = { ...selections }
                                                        uploadedProducts.forEach((_, index) => {
                                                            if (!newSelections[index]) {
                                                                newSelections[index] = { plainBg: false, bgReplace: false, model: false, campaign: false }
                                                            }
                                                            newSelections[index].bgReplace = newValue
                                                        })
                                                        setSelections(newSelections)
                                                    }}
                                                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                                                    disabled={!canEdit}
                                                >
                                                    {columnSelections.bgReplace ? (
                                                        <CheckSquare className="w-5 h-5 text-[#884cff]" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                                <span>BG Replace Image</span>
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[#1a1a1a] min-w-[150px]">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        const newValue = !columnSelections.model
                                                        setColumnSelections(prev => ({ ...prev, model: newValue }))
                                                        const newSelections = { ...selections }
                                                        uploadedProducts.forEach((_, index) => {
                                                            if (!newSelections[index]) {
                                                                newSelections[index] = { plainBg: false, bgReplace: false, model: false, campaign: false }
                                                            }
                                                            newSelections[index].model = newValue
                                                        })
                                                        setSelections(newSelections)
                                                    }}
                                                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                                                    disabled={!canEdit}
                                                >
                                                    {columnSelections.model ? (
                                                        <CheckSquare className="w-5 h-5 text-[#884cff]" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                                <span>Model Image</span>
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[#1a1a1a] min-w-[150px]">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        const newValue = !columnSelections.campaign
                                                        setColumnSelections(prev => ({ ...prev, campaign: newValue }))
                                                        const newSelections = { ...selections }
                                                        uploadedProducts.forEach((_, index) => {
                                                            if (!newSelections[index]) {
                                                                newSelections[index] = { plainBg: false, bgReplace: false, model: false, campaign: false }
                                                            }
                                                            newSelections[index].campaign = newValue
                                                        })
                                                        setSelections(newSelections)
                                                    }}
                                                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                                                    disabled={!canEdit}
                                                >
                                                    {columnSelections.campaign ? (
                                                        <CheckSquare className="w-5 h-5 text-[#884cff]" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                                <span>Campaign Image</span>
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[#1a1a1a] min-w-[100px]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e6e6e6]">
                                    {uploadedProducts.map((product, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative group w-20 h-20 flex-shrink-0">
                                                        <img
                                                            src={product.uploaded_image_url}
                                                            alt={`Product ${index + 1}`}
                                                            className="w-full h-full object-contain bg-white border border-[#e6e6e6] rounded-lg"
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                window.open(product.uploaded_image_url, '_blank')
                                                            }}
                                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                                                            title="View full image"
                                                        >
                                                            <Eye className="w-4 h-4 text-white" />
                                                        </button>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-[#1a1a1a]">Product {index + 1}</p>
                                                        {product.ornament_type && (
                                                            <p className="text-xs text-[#884cff] mt-1 font-medium">
                                                                {product.ornament_type}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelections(prev => ({
                                                            ...prev,
                                                            [index]: {
                                                                ...(prev[index] || { plainBg: false, bgReplace: false, model: false, campaign: false }),
                                                                plainBg: !(prev[index]?.plainBg || false)
                                                            }
                                                        }))
                                                    }}
                                                    className="flex items-center justify-center mx-auto hover:opacity-70 transition-opacity"
                                                    disabled={!canEdit}
                                                >
                                                    {selections[index]?.plainBg ? (
                                                        <CheckSquare className="w-6 h-6 text-[#884cff]" />
                                                    ) : (
                                                        <Square className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelections(prev => ({
                                                            ...prev,
                                                            [index]: {
                                                                ...(prev[index] || { plainBg: false, bgReplace: false, model: false, campaign: false }),
                                                                bgReplace: !(prev[index]?.bgReplace || false)
                                                            }
                                                        }))
                                                    }}
                                                    className="flex items-center justify-center mx-auto hover:opacity-70 transition-opacity"
                                                    disabled={!canEdit}
                                                >
                                                    {selections[index]?.bgReplace ? (
                                                        <CheckSquare className="w-6 h-6 text-[#884cff]" />
                                                    ) : (
                                                        <Square className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelections(prev => ({
                                                            ...prev,
                                                            [index]: {
                                                                ...(prev[index] || { plainBg: false, bgReplace: false, model: false, campaign: false }),
                                                                model: !(prev[index]?.model || false)
                                                            }
                                                        }))
                                                    }}
                                                    className="flex items-center justify-center mx-auto hover:opacity-70 transition-opacity"
                                                    disabled={!canEdit}
                                                >
                                                    {selections[index]?.model ? (
                                                        <CheckSquare className="w-6 h-6 text-[#884cff]" />
                                                    ) : (
                                                        <Square className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelections(prev => ({
                                                            ...prev,
                                                            [index]: {
                                                                ...(prev[index] || { plainBg: false, bgReplace: false, model: false, campaign: false }),
                                                                campaign: !(prev[index]?.campaign || false)
                                                            }
                                                        }))
                                                    }}
                                                    className="flex items-center justify-center mx-auto hover:opacity-70 transition-opacity"
                                                    disabled={!canEdit}
                                                >
                                                    {selections[index]?.campaign ? (
                                                        <CheckSquare className="w-6 h-6 text-[#884cff]" />
                                                    ) : (
                                                        <Square className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {canEdit && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteProduct(product)
                                                        }}
                                                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded hover:bg-red-50"
                                                        title="Delete product"
                                                        disabled={deleting || uploading}
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Selection Summary */}
                        <div className="px-4 py-4 bg-gray-50 border-t border-[#e6e6e6]">
                            <div className="text-sm text-[#708090]">
                                {(() => {
                                    const totalSelected = Object.values(selections).reduce((acc, sel) => {
                                        return acc + (sel.plainBg ? 1 : 0) + (sel.bgReplace ? 1 : 0) + (sel.model ? 1 : 0) + (sel.campaign ? 1 : 0)
                                    }, 0)
                                    const totalCredits = totalSelected * creditSettings.credits_per_image_generation
                                    return totalSelected > 0 ? (
                                        <span>
                                            <span className="font-semibold text-[#1a1a1a]">{totalSelected}</span> image{totalSelected !== 1 ? 's' : ''} selected • 
                                            <span className="font-semibold text-[#884cff] ml-1">{totalCredits}</span> credits required
                                        </span>
                                    ) : (
                                        <span className="text-yellow-600">⚠️ Select at least one image type to generate in the next step</span>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!hasProducts && !hasSelectedFiles && (
                <div className="text-center py-12 border-2 border-dashed border-[#e6e6e6] rounded-lg">
                    <ImageIcon className="w-16 h-16 text-[#708090] mx-auto mb-4" />
                    <p className="text-[#708090] mb-4">No products uploaded yet</p>
                    <p className="text-sm text-[#708090]">Click "Choose Files" to upload product images</p>
                </div>
            )}
        </div>
    )
})

ProductUploadPage.displayName = 'ProductUploadPage'
