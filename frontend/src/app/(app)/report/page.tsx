"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Camera,
    ImagePlus,
    X,
    MapPin,
    Sparkles,
    Send,
    Edit3,
    AlertTriangle,
} from "lucide-react";
import Image from "next/image";

/* ────────────────────────────────────────────────────────── */
/*  Types                                                      */
/* ────────────────────────────────────────────────────────── */

interface AnalysisResult {
    is_civic_issue: boolean;
    category: string;
    severity_score: number;
    title: string;
    description: string;
}

type Step = "upload" | "analyzing" | "confirm";

/* ────────────────────────────────────────────────────────── */
/*  Component                                                  */
/* ────────────────────────────────────────────────────────── */

export default function ReportPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [step, setStep] = useState<Step>("upload");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        null
    );
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Editable fields from AI analysis
    const [editTitle, setEditTitle] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editSeverity, setEditSeverity] = useState(5);

    /* ── Get geolocation ──────────────────────────────────── */
    const getLocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                toast.error("Geolocation is not supported by your browser.");
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setCoords(loc);
                    resolve(loc);
                },
                () => {
                    toast.error("Location access denied. Issue will be saved without GPS.");
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }, []);

    /* ── Handle image selection ──────────────────────────── */
    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const url = URL.createObjectURL(file);
        setSelectedFile(file);
        setPreviewUrl(url);

        // Request location immediately
        getLocation();

        // Start AI analysis
        setStep("analyzing");
        await analyzeImage(file);
    }

    /* ── Call the FastAPI backend ─────────────────────────── */
    async function analyzeImage(file: File) {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("http://localhost:8000/api/analyze-issue/", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: "Unknown error" }));
                throw new Error(err.detail || `Server error ${res.status}`);
            }

            const data: AnalysisResult = await res.json();

            if (!data.is_civic_issue) {
                toast.error(
                    "No valid civic issue detected in this photo. Please try again."
                );
                resetForm();
                return;
            }

            // Populate editable fields
            setAnalysis(data);
            setEditTitle(data.title);
            setEditDesc(data.description);
            setEditCategory(data.category);
            setEditSeverity(data.severity_score);
            setStep("confirm");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Analysis failed";
            toast.error(message);
            resetForm();
        }
    }

    /* ── Final submit → Supabase Storage + DB ───────────── */
    async function handleFinalSubmit() {
        if (!selectedFile || !analysis) return;
        setIsSubmitting(true);

        try {
            const supabase = createClient();

            // Get current user
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in.");
                setIsSubmitting(false);
                return;
            }

            // Upload image to Supabase Storage
            const fileExt = selectedFile.name.split(".").pop() || "jpg";
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("issues-images")
                .upload(fileName, selectedFile, {
                    contentType: selectedFile.type,
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            // Get public URL
            const {
                data: { publicUrl },
            } = supabase.storage.from("issues-images").getPublicUrl(fileName);

            // Insert into issues table
            const { error: insertError } = await supabase.from("issues").insert({
                user_id: user.id,
                image_url: publicUrl,
                ai_title: editTitle,
                ai_description: editDesc,
                ai_category: editCategory,
                ai_severity_score: editSeverity,
                latitude: coords?.lat || null,
                longitude: coords?.lng || null,
            });

            if (insertError) {
                throw new Error(`Failed to save issue: ${insertError.message}`);
            }

            toast.success("Issue reported successfully! 🎉");
            router.push("/");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Submission failed";
            toast.error(message);
        }

        setIsSubmitting(false);
    }

    /* ── Reset ──────────────────────────────────────────── */
    function resetForm() {
        setStep("upload");
        setSelectedFile(null);
        setPreviewUrl(null);
        setAnalysis(null);
        setCoords(null);
        setEditTitle("");
        setEditDesc("");
        setEditCategory("");
        setEditSeverity(5);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    /* ────────────────────────────────────────────────────── */
    /*  RENDER                                                 */
    /* ────────────────────────────────────────────────────── */

    return (
        <div className="max-w-lg mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Report Issue
                </h1>
                <p className="text-muted text-sm mt-1">
                    Snap a photo — our AI will do the rest
                </p>
            </div>

            {/* ── STEP 1: Upload ─────────────────────────────── */}
            {step === "upload" && (
                <div className="space-y-4">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                        id="image-upload"
                    />

                    {/* Camera / upload area */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all duration-300 flex flex-col items-center justify-center gap-4 group cursor-pointer"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Camera
                                size={36}
                                className="text-accent"
                                strokeWidth={1.5}
                            />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-foreground text-base">
                                Tap to take a photo
                            </p>
                            <p className="text-sm text-muted mt-1">
                                or select from your gallery
                            </p>
                        </div>
                    </button>

                    {/* Alternative gallery button */}
                    <button
                        onClick={() => {
                            // Create a new input without capture to open gallery
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (e) => {
                                const target = e.target as HTMLInputElement;
                                if (target.files?.[0]) {
                                    // Trigger the same handler
                                    const changeEvent = { target } as unknown as React.ChangeEvent<HTMLInputElement>;
                                    handleFileChange(changeEvent);
                                }
                            };
                            input.click();
                        }}
                        className="w-full py-3 px-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium text-muted hover:text-foreground hover:border-slate-300 dark:hover:border-white/15 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <ImagePlus size={18} />
                        Choose from gallery
                    </button>
                </div>
            )}

            {/* ── STEP 2: Analyzing ──────────────────────────── */}
            {step === "analyzing" && previewUrl && (
                <div className="space-y-6">
                    {/* Image with scanning animation */}
                    <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-100 dark:bg-white/5">
                        <Image
                            src={previewUrl}
                            alt="Selected photo"
                            fill
                            className="object-cover"
                            sizes="(max-width: 512px) 100vw, 512px"
                        />

                        {/* Scanning overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent">
                            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-scan" />
                        </div>

                        {/* Status badge */}
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
                                    <Sparkles size={16} className="text-accent animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-semibold">
                                        AI is analyzing the issue…
                                    </p>
                                    <p className="text-white/60 text-xs mt-0.5">
                                        Detecting category, severity & description
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cancel */}
                    <button
                        onClick={resetForm}
                        className="w-full py-3 text-sm text-muted hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* ── STEP 3: Confirmation Card ─────────────────── */}
            {step === "confirm" && previewUrl && analysis && (
                <div className="space-y-4">
                    {/* Image preview (smaller) */}
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 dark:bg-white/5">
                        <Image
                            src={previewUrl}
                            alt="Issue photo"
                            fill
                            className="object-cover"
                            sizes="(max-width: 512px) 100vw, 512px"
                        />
                        <button
                            onClick={resetForm}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                            <X size={16} />
                        </button>

                        {/* Location badge */}
                        {coords && (
                            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1">
                                <MapPin size={12} />
                                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                            </div>
                        )}
                    </div>

                    {/* AI Result Card */}
                    <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
                            <Sparkles size={14} />
                            AI Analysis Result
                            <Edit3 size={12} className="text-muted ml-auto" />
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-xs font-medium text-muted mb-1.5 block">
                                Title
                            </label>
                            <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                            />
                        </div>

                        {/* Category + Severity row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-muted mb-1.5 block">
                                    Category
                                </label>
                                <input
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted mb-1.5 block">
                                    Severity (1-10)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min={1}
                                        max={10}
                                        value={editSeverity}
                                        onChange={(e) => setEditSeverity(Number(e.target.value))}
                                        className="flex-1 accent-accent"
                                    />
                                    <span
                                        className={`text-sm font-bold min-w-[2rem] text-center ${editSeverity <= 3
                                            ? "text-emerald-500"
                                            : editSeverity <= 6
                                                ? "text-amber-500"
                                                : "text-red-500"
                                            }`}
                                    >
                                        {editSeverity}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-medium text-muted mb-1.5 block">
                                Description
                            </label>
                            <textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-2xl shadow-lg shadow-accent/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg
                                    className="animate-spin h-5 w-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Submitting…
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Confirm & Submit
                            </>
                        )}
                    </button>

                    {/* Cancel */}
                    <button
                        onClick={resetForm}
                        className="w-full py-2.5 text-sm text-muted hover:text-foreground transition-colors"
                    >
                        Start over
                    </button>
                </div>
            )}
        </div>
    );
}
