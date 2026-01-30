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
import { Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "react-hot-toast";

const INTRO =
  "Curious to discover how Lovable can speed up development process? Meet with one of our product experts to learn more.";

export function ContactSalesModal({ open, onOpenChange }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    work_email: "",
    phone: "",
    company_website: "",
    problems_trying_to_solve: "",
    users_to_onboard: "",
    timeline: "",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateStep1 = () => {
    if (!form.first_name.trim()) return "First name is required.";
    if (!form.last_name.trim()) return "Last name is required.";
    if (!form.work_email.trim()) return "Work email is required.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!form.company_website.trim()) return "Company's website is required.";
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) {
      toast.error(err);
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiService.submitContactSales(form);
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
      setStep(1);
      setSuccess(false);
      setForm({
        first_name: "",
        last_name: "",
        work_email: "",
        phone: "",
        company_website: "",
        problems_trying_to_solve: "",
        users_to_onboard: "",
        timeline: "",
      });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {success ? (
          <div className="py-6 text-center">
            <CheckCircle className="mx-auto h-14 w-14 text-green-500 mb-4" />
            <DialogTitle className="text-xl">Thank you</DialogTitle>
            <DialogDescription className="mt-2 text-base">
              Our team will get back to you shortly.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {step === 1 ? "Contact details" : "Tell us more"}
              </DialogTitle>
              <DialogDescription>
                {step === 1 ? INTRO : "What problems are you trying to solve with Lovable?"}
              </DialogDescription>
            </DialogHeader>

            {step === 1 && (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">{INTRO}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First name *</Label>
                    <Input
                      id="first_name"
                      value={form.first_name}
                      onChange={(e) => update("first_name", e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last name *</Label>
                    <Input
                      id="last_name"
                      value={form.last_name}
                      onChange={(e) => update("last_name", e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_email">Work email *</Label>
                  <Input
                    id="work_email"
                    type="email"
                    value={form.work_email}
                    onChange={(e) => update("work_email", e.target.value)}
                    placeholder="Work email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_website">Company&apos;s website *</Label>
                  <Input
                    id="company_website"
                    type="url"
                    value={form.company_website}
                    onChange={(e) => update("company_website", e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleNext} className="gap-2">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="problems">What problems are you trying to solve with Lovable?</Label>
                  <Textarea
                    id="problems"
                    value={form.problems_trying_to_solve}
                    onChange={(e) => update("problems_trying_to_solve", e.target.value)}
                    placeholder="Describe your goals..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="users">How many users would you like to onboard into a shared Lovable Enterprise workspace to start?</Label>
                  <Input
                    id="users"
                    value={form.users_to_onboard}
                    onChange={(e) => update("users_to_onboard", e.target.value)}
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline">Do you have a timeline to get started?</Label>
                  <Input
                    id="timeline"
                    value={form.timeline}
                    onChange={(e) => update("timeline", e.target.value)}
                    placeholder="e.g. Next quarter"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
