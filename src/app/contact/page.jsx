"use client";

import { useState } from "react";
import { apiService } from "@/lib/api";
import { Loader2, Send, Mail, Phone, MapPin, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
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
    if (!/^\d{10}$/.test(form.mobile.replace(/\D/g, ''))) return "Please enter a valid 10-digit mobile number.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.reason.trim()) return "Reason for contact is required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(res?.error || "Something went wrong.");
      }
    } catch (e) {
      toast.error(e?.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Contact Us</h1>
          <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
            We'd love to hear from you. Please fill out the form below or reach out to us directly.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">

          {/* Contact Details */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Get in Touch</h2>

            <div className="space-y-8">
              <div className="flex items-start">
                <MapPin className="h-6 w-6 text-indigo-600 mt-1 mr-4 shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Office Address</h3>
                  <p className="mt-1 text-gray-600">
                    202, Serinity Diamond, Gopanpally,<br />
                    Serilingampally, Hyderabad, India – 500046
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="h-6 w-6 text-indigo-600 mt-1 mr-4 shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Contact Number</h3>
                  <p className="mt-1 text-gray-600">
                    <a href="tel:+918790900881" className="hover:text-indigo-600 transition-colors">
                      +91 8790900881
                    </a>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Assistance hours: Monday - Sunday 24/7 Hours
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Mail className="h-6 w-6 text-indigo-600 mt-1 mr-4 shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Email Address</h3>
                  <p className="mt-1 text-gray-600">
                    <a href="mailto:support@findmyguru.com" className="hover:text-indigo-600 transition-colors">
                      support@findmyguru.com
                    </a>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Assistance hours: Monday - Sunday 24/7 Hours
                  </p>
                </div>
              </div>
            </div>

            {/* Google Map Embed */}
            <div className="mt-10 h-64 w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.457891392658!2d78.3361113148769!3d17.43779778804825!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb939105555555%3A0x1234567890abcdef!2sSerenity%20Diamond!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Office Location"
              ></iframe>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Have any query?</h2>

            {success ? (
              <div className="py-12 text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
                <h3 className="text-2xl font-medium text-gray-900">Thank you!</h3>
                <p className="mt-4 text-gray-600 max-w-xs mx-auto">
                  We have received your message and will get back to you shortly.
                </p>
                <Button onClick={() => setSuccess(false)} className="mt-8" variant="outline">
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Full Name</Label>
                    <Input
                      id="contact-name"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-mobile">Phone Number</Label>
                  <Input
                    id="contact-mobile"
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => update("mobile", e.target.value)}
                    placeholder="10-digit mobile number"
                    maxLength={15}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-reason">Enter Your Message</Label>
                  <Textarea
                    id="contact-reason"
                    value={form.reason}
                    onChange={(e) => update("reason", e.target.value)}
                    placeholder="How can we help you?"
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
