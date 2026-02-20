"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowBigUp, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Issue {
    id: string;
    user_id: string;
    image_url: string | null;
    ai_title: string | null;
    ai_description: string | null;
    ai_category: string | null;
    ai_severity_score: number | null;
    latitude: number | null;
    longitude: number | null;
    status: string;
    upvote_count: number;
    created_at: string;
}

interface IssueCardProps {
    issue: Issue;
    isVoted: boolean;
    userId: string;
    onVoteToggle: (issueId: string, newCount: number, voted: boolean) => void;
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function statusBadge(status: string) {
    const styles: Record<string, string> = {
        open: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
        in_progress:
            "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
        resolved:
            "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    };
    const labels: Record<string, string> = {
        open: "Open",
        in_progress: "In Progress",
        resolved: "Resolved",
    };
    return (
        <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${styles[status] || styles.open
                }`}
        >
            {labels[status] || status}
        </span>
    );
}

function severityColor(score: number | null): string {
    if (!score) return "bg-slate-200 dark:bg-slate-700";
    if (score <= 3) return "bg-emerald-400";
    if (score <= 6) return "bg-amber-400";
    return "bg-red-500";
}

export default function IssueCard({
    issue,
    isVoted,
    userId,
    onVoteToggle,
}: IssueCardProps) {
    const [voting, setVoting] = useState(false);

    async function handleUpvote() {
        if (voting) return;
        setVoting(true);

        // Optimistic update
        const optimisticVoted = !isVoted;
        const optimisticCount = issue.upvote_count + (optimisticVoted ? 1 : -1);
        onVoteToggle(issue.id, optimisticCount, optimisticVoted);

        try {
            const supabase = createClient();
            const { data, error } = await supabase.rpc("toggle_upvote", {
                p_issue_id: issue.id,
            });

            if (error) {
                // Revert optimistic update
                onVoteToggle(issue.id, issue.upvote_count, isVoted);
                toast.error("Failed to vote. Please try again.");
            } else if (data) {
                // Sync with server response
                onVoteToggle(issue.id, data.upvote_count, data.voted);
            }
        } catch {
            onVoteToggle(issue.id, issue.upvote_count, isVoted);
            toast.error("Something went wrong.");
        }

        setVoting(false);
    }

    return (
        <article className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-white/10 transition-all duration-200 shadow-sm hover:shadow-md">
            {/* Image */}
            {issue.image_url && (
                <div className="relative w-full aspect-video bg-slate-100 dark:bg-white/5">
                    <Image
                        src={issue.image_url}
                        alt={issue.ai_title || "Issue photo"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 672px) 100vw, 672px"
                    />
                    {/* Severity indicator */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1.5 rounded-full">
                        <div
                            className={`w-2 h-2 rounded-full ${severityColor(
                                issue.ai_severity_score
                            )}`}
                        />
                        {issue.ai_severity_score}/10
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-[15px] leading-snug line-clamp-2">
                            {issue.ai_title || "Untitled Issue"}
                        </h3>
                        {issue.ai_category && (
                            <span className="text-xs text-muted font-medium">
                                {issue.ai_category}
                            </span>
                        )}
                    </div>
                    {statusBadge(issue.status)}
                </div>

                {issue.ai_description && (
                    <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-3">
                        {issue.ai_description}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 text-xs text-muted-light">
                        <span className="flex items-center gap-1">
                            <Clock size={13} />
                            {timeAgo(issue.created_at)}
                        </span>
                        {issue.latitude && issue.longitude && (
                            <a
                                href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                                title="View on map"
                            >
                                <MapPin size={13} />
                                Maps
                            </a>
                        )}
                    </div>

                    {/* Upvote button */}
                    <button
                        onClick={handleUpvote}
                        disabled={voting}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${isVoted
                            ? "bg-accent text-white shadow-md shadow-accent/25"
                            : "bg-slate-100 dark:bg-white/5 text-muted hover:bg-accent-light hover:text-accent"
                            } disabled:opacity-50`}
                    >
                        <ArrowBigUp
                            size={18}
                            fill={isVoted ? "currentColor" : "none"}
                            strokeWidth={2}
                        />
                        {issue.upvote_count}
                    </button>
                </div>
            </div>
        </article>
    );
}
