"use client"

import { useState, useEffect } from "react"
import { FileText, MessageCircle, X, Trash2 } from "lucide-react"
import { useLanguage } from "@/context/LanguageContext"
import { apiService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { formatRelativeCommentTime } from "@/lib/comment-time"

const INPUT_CLASS =
    "w-full px-4 py-3 bg-input border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring resize-none disabled:opacity-50 disabled:cursor-not-allowed"

const DEFAULT_COMMENTS_BY_FIELD = {
    description: [],
    target_audience: [],
    campaign_season: [],
}

export function BriefAndConcept({ project, collectionData, canEdit = true, onFormDataChange }) {
    const { t } = useLanguage()
    const { token } = useAuth()
    const [description, setDescription] = useState("")
    const [targetAudience, setTargetAudience] = useState("")
    const [campaignSeason, setCampaignSeason] = useState("")
    const [hasDescription, setHasDescription] = useState(false)
    const [activeCommentField, setActiveCommentField] = useState(null)
    const [commentsByField, setCommentsByField] = useState(DEFAULT_COMMENTS_BY_FIELD)
    const [draftComment, setDraftComment] = useState("")
    const [replyDraftByCommentId, setReplyDraftByCommentId] = useState({})
    const [replyingToCommentId, setReplyingToCommentId] = useState(null)
    const [commentError, setCommentError] = useState("")
    const [commentMessage, setCommentMessage] = useState("")
    const [savingComments, setSavingComments] = useState(false)
    const [nowMs, setNowMs] = useState(Date.now())

    const commentFieldConfig = {
        description: {
            payloadKey: "description_comments",
            title: t("images.projectDescriptionOptional"),
        },
        target_audience: {
            payloadKey: "target_audience_comments",
            title: t("images.targetAudience"),
        },
        campaign_season: {
            payloadKey: "campaign_season_comments",
            title: t("images.campaignSeason"),
        },
    }

    const activeCommentConfig = activeCommentField ? commentFieldConfig[activeCommentField] : null
    const currentComments = activeCommentField ? (commentsByField[activeCommentField] || []) : []

    useEffect(() => {
        const nextDescription = collectionData?.description || ""
        const nextTargetAudience = collectionData?.target_audience || ""
        const nextCampaignSeason = collectionData?.campaign_season || ""

        setDescription(nextDescription)
        setTargetAudience(nextTargetAudience)
        setCampaignSeason(nextCampaignSeason)
        setHasDescription(nextDescription.trim().length > 0)
        setCommentsByField({
            description: Array.isArray(collectionData?.description_comments) ? collectionData.description_comments : [],
            target_audience: Array.isArray(collectionData?.target_audience_comments) ? collectionData.target_audience_comments : [],
            campaign_season: Array.isArray(collectionData?.campaign_season_comments) ? collectionData.campaign_season_comments : [],
        })
    }, [
        collectionData?.description,
        collectionData?.target_audience,
        collectionData?.campaign_season,
        collectionData?.description_comments,
        collectionData?.target_audience_comments,
        collectionData?.campaign_season_comments,
    ])

    useEffect(() => {
        if (onFormDataChange) {
            onFormDataChange({
                description,
                targetAudience,
                campaignSeason,
                hasDescription,
            })
        }
    }, [description, targetAudience, campaignSeason, hasDescription, onFormDataChange])

    const handleDescriptionChange = (e) => {
        const value = e.target.value
        setDescription(value)
        setHasDescription(value.trim().length > 0)
    }

    const loadCommentsFromDb = async () => {
        if (!collectionData?.id || !token) return
        try {
            const latestCollection = await apiService.getCollection(collectionData.id, token, {
                cache: "no-store",
            })
            setCommentsByField({
                description: Array.isArray(latestCollection?.description_comments) ? latestCollection.description_comments : [],
                target_audience: Array.isArray(latestCollection?.target_audience_comments) ? latestCollection.target_audience_comments : [],
                campaign_season: Array.isArray(latestCollection?.campaign_season_comments) ? latestCollection.campaign_season_comments : [],
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
            const response = await apiService.updateBriefComments(
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

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-gradient rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground text-2xl">{t("images.briefAndConcept")}</h3>
                    <p className="text-sm text-muted-foreground">{t("images.defineProjectVision")}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label htmlFor="project-description" className="font-bold text-foreground text-base mb-1">
                            {t("images.projectDescriptionOptional")}
                        </label>
                        {renderCommentButton("description")}
                    </div>
                    <textarea
                        id="project-description"
                        value={description}
                        onChange={handleDescriptionChange}
                        placeholder={t("images.enterProjectDescription")}
                        className={`${INPUT_CLASS} h-32`}
                        disabled={!canEdit}
                    />
                    {activeCommentField && (
                        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                            <div className="w-full max-w-md bg-card rounded-xl shadow-2xl border border-border">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                    <h4 className="text-sm font-semibold text-foreground text-lg">{activeCommentConfig?.title} Comments</h4>
                                    <button
                                        type="button"
                                        onClick={closeComments}
                                        className="p-1 rounded hover:bg-secondary"
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
                                                                        <div key={reply.id} className="bg-card border border-border rounded p-2">
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
                                    {commentMessage && <p className="text-xs text-green-400">{commentMessage}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center w-full items-center gap-3">
                    <div className="space-y-3 w-1/2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="target-audience" className="font-bold text-foreground text-base mb-1">{t("images.targetAudience")}</label>
                            {renderCommentButton("target_audience")}
                        </div>
                        <input
                            id="target-audience"
                            type="text"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            placeholder={t("images.enterTargetAudience")}
                            className={INPUT_CLASS}
                            disabled={!canEdit}
                        />
                    </div>

                    <div className="space-y-3 w-1/2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="campaign-season" className="font-bold text-foreground text-base mb-1">{t("images.campaignSeason")}</label>
                            {renderCommentButton("campaign_season")}
                        </div>
                        <input
                            id="campaign-season"
                            type="text"
                            value={campaignSeason}
                            onChange={(e) => setCampaignSeason(e.target.value)}
                            placeholder={t("images.enterCampaignSeason")}
                            className={INPUT_CLASS}
                            disabled={!canEdit}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
