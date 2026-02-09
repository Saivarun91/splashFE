"use client";

import { useState, useEffect } from "react";
import { apiService } from "@/lib/api";
import { Loader2, Mail, Phone, MapPin, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoveLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/home/Navigation";

export default function ContactPage() {
  const generateCaptcha = () => {
    return Math.random().toString(36).substring(2, 6).toLocaleLowerCase() + Math.random().toString(36).substring(2, 6).toLocaleLowerCase();
  };
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    reason: "",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaValid, setCaptchaValid] = useState(false);

  const validate = () => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.mobile.trim()) return "Mobile number is required.";
    if (!/^\d{10}$/.test(form.mobile.replace(/\D/g, "")))
      return "Please enter a valid 10-digit mobile number.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.reason.trim()) return "Reason for contact is required.";
    return null;
  };
  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);
  
  useEffect(() => {
    setCaptchaValid(captchaInput === captcha);
  }, [captchaInput, captcha]);

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
        window.scrollTo({ top: 0, behavior: "smooth" });
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
    <>
    <Navigation />
    <div className="min-h-screen bg-white text-[#0c1421]">
      {/* Header */}
      <section className="relative py-20 md:py-32 bg-[#f8f9fc] text-center">
        <div className="max-w-screen-xl mx-auto px-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-500">
            Contact Us
          </h1>
          <p className="text-lg md:text-xl text-[#313957] max-w-2xl mx-auto leading-relaxed">
            We'd love to hear from you. Please fill out the form below or reach
            out to us directly.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Details */}
          <div>
            <h2 className="text-3xl font-bold mb-10">Get in Touch</h2>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-[#5533ff] mt-1 shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">Office Address</h3>
                  <p className="text-[#313957] mt-1 leading-relaxed">
                    <a
                      href="https://maps.app.goo.gl/3tMuX7F4xemYYrxH6"
                      className="hover:text-[#5533ff]"
                      target="_blank"
                    >
                      501, Manjeera Majestic Commercial Complex,
                      <br />
                      JNTU Road,KPHB, Hyderabad , Telangana, India 500085
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-[#5533ff] mt-1 shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">Contact Number</h3>
                  <p className="text-[#313957] mt-1">
                    <a href="tel:+918790900881" className="hover:text-[#5533ff]">
                      +91 8790900881
                    </a>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Assistance hours: Monday - Sunday 24/7 Hours
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-[#5533ff] mt-1 shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">Email Address</h3>
                  <p className="text-[#313957] mt-1">
                    <a
                      href="mailto:support@gosplash.ai"
                      className="hover:text-[#5533ff]"
                    >
                      support@gosplash.ai
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
<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3805.323180100733!2d78.39097917516732!3d17.492079483413075!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb910057424ed5%3A0x199dce60198e6b9b!2sTechsprout%20AI%20Labs%20Pvt.%20Ltd.!5e0!3m2!1sen!2sin!4v1770624140087!5m2!1sen!2sin" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Office Location" >
  </iframe> 
  </div> 
  </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 md:p-10 border border-[#e6e6e6] shadow-sm">
            <h2 className="text-3xl font-bold mb-8">Have any query?</h2>

            {success ? (
              <div className="py-12 text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
                <h3 className="text-2xl font-semibold">Thank you!</h3>
                <p className="mt-4 text-[#313957] max-w-xs mx-auto">
                  We have received your message and will get back to you shortly.
                </p>
                <Button
                  onClick={() => setSuccess(false)}
                  variant="outline"
                  className="mt-8"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={form.mobile}
                    onChange={(e) => update("mobile", e.target.value)}
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Enter Your Message</Label>
                  <Textarea
                    value={form.reason}
                    onChange={(e) => update("reason", e.target.value)}
                    rows={6}
                    placeholder="How can we help you?"
                  />
                </div>
                <div className="space-y-2">
  <Label>Captcha</Label>

  <div className="flex items-center gap-4">
    <div className="px-4 py-2 bg-gray-100 border rounded font-mono text-lg tracking-widest">
      {captcha}
    </div>

    <Button
      type="button"
      variant="outline"
      onClick={() => {
        setCaptcha(generateCaptcha());
        setCaptchaInput("");
      }}
    >
      Refresh
    </Button>
  </div>

  <Input
    value={captchaInput}
    onChange={(e) => setCaptchaInput(e.target.value.toLowerCase())}
    placeholder="Enter captcha"
  />

  {!captchaValid && captchaInput && (
    <p className="text-sm text-red-500" style={{ fontSize: '12px' }}>Captcha does not match</p>
  )}
</div>


<Button
  type="submit"
  disabled={submitting || !captchaValid}
  className="w-full bg-[#5533ff] hover:bg-[#4322e8] text-white font-bold disabled:opacity-50"
>
  {submitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Sending...
    </>
  ) : (
    "Send Message"
  )}
</Button>

              </form>
            )}
          </div>
        </div>
      </section>

      {/* <button
        onClick={() => {
          router.push("/");
        }}
        className="fixed top-10 left-6 z-50
                   bg-white/80 backdrop-blur-sm border border-gray-200 text-
                   hover:bg-gray-100 hover:text-black
                   px-4 py-2 rounded-full shadow-sm transition-all flex items-center gap-2"
      >
        <MoveLeft size={16} /> Back
      </button> */}
    </div>
    </>
  );
}