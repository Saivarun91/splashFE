"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "react-hot-toast";

export function FooterContactModal({ open, onOpenChange }) {
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        name: "",
        mobile: "",
        email: "",
        reason: "",
    });

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const validate = () => {
        if (!form.name.trim()) return "Name is required.";
        if (!form.mobile.trim()) return "Mobile number is required.";
        // Simple 10-digit validation for mobile
        if (!/^\d{10}$/.test(form.mobile.replace(/\D/g, ''))) return "Please enter a valid 10-digit mobile number.";
        if (!form.email.trim()) return "Email is required.";
        if (!form.reason.trim()) return "Reason for contact is required.";
        return null;
    };

    const handleSubmit = async () => {
        const err = validate();
        if (err) {
            toast.error(err);
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiService.submitContact(form);
            if (res?.success) {
                setSuccess(true);
            } else {
                toast.error(res?.error || "Something went wrong.");
            }
        } catch (e) {
            toast.error(e?.message || "Failed to submit.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = (open) => {
        if (!open) {
            // Reset form on close after a delay or immediately?
            // Better to reset state when reopening or closing completed form
            if (success) {
                setSuccess(false);
                setForm({
                    name: "",
                    mobile: "",
                    email: "",
                    reason: "",
                });
            }
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                {success ? (
                    <div className="py-6 text-center">
                        <CheckCircle className="mx-auto h-14 w-14 text-green-500 mb-4" />
                        <DialogTitle className="text-xl">Thank you</DialogTitle>
                        <DialogDescription className="mt-2 text-base">
                            We have received your details and will get back to you shortly.
                        </DialogDescription>
                        <Button onClick={() => onOpenChange(false)} className="mt-6">
                            Close
                        </Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Contact Us</DialogTitle>
                            <DialogDescription>
                                Fill out the form below and we will get back to you.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="contact-name">Name *</Label>
                                <Input
                                    id="contact-name"
                                    value={form.name}
                                    onChange={(e) => update("name", e.target.value)}
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-mobile">Mobile Number *</Label>
                                <Input
                                    id="contact-mobile"
                                    type="tel"
                                    value={form.mobile}
                                    onChange={(e) => update("mobile", e.target.value)}
                                    placeholder="10-digit mobile number"
                                    maxLength={15}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-email">Email *</Label>
                                <Input
                                    id="contact-email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => update("email", e.target.value)}
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-reason">Reason to contact *</Label>
                                <Textarea
                                    id="contact-reason"
                                    value={form.reason}
                                    onChange={(e) => update("reason", e.target.value)}
                                    placeholder="How can we help you?"
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button onClick={handleSubmit} disabled={submitting} className="gap-2 w-full sm:w-auto">
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    Submit
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
