"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type AdminIssue = {
    id: string;
    image_url: string | null;
    ai_title: string | null;
    ai_category: string | null;
    ai_severity_score: number | null;
    upvote_count: number;
    status: string;
    created_at: string;
    urgencyScore: number;
};

export default function IssueTable({
    initialIssues,
}: {
    initialIssues: AdminIssue[];
}) {
    const [issues, setIssues] = useState<AdminIssue[]>(initialIssues);

    // Optimistic handler for status changes
    async function handleStatusChange(issueId: string, newStatus: string) {
        const previousIssues = [...issues];

        // Optimistically update UI
        setIssues((prev) =>
            prev.map((issue) =>
                issue.id === issueId ? { ...issue, status: newStatus } : issue
            )
        );

        const supabase = createClient();
        const { error } = await supabase
            .from("issues")
            .update({ status: newStatus })
            .eq("id", issueId);

        if (error) {
            toast.error("Failed to update status");
            // Revert if error
            setIssues(previousIssues);
        } else {
            toast.success(`Status updated to ${newStatus}`);
        }
    }

    if (issues.length === 0) {
        return (
            <div className="p-12 text-center text-slate-500">
                No active issues require attention.
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">
                        <th className="px-6 py-4">Issue</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Reported</th>
                        <th className="px-6 py-4 text-center">Urgency</th>
                        <th className="px-6 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {issues.map((issue) => (
                        <tr
                            key={issue.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                        {issue.image_url ? (
                                            <Image
                                                src={issue.image_url}
                                                alt="Thumbnail"
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                                N/A
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                                            {issue.ai_title || "Untitled"}
                                        </p>
                                        <p className="text-xs text-slate-500 line-clamp-1">
                                            ID: {issue.id.slice(0, 8)}…
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                    {issue.ai_category || "Uncategorized"}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                                {formatDistanceToNow(new Date(issue.created_at), {
                                    addSuffix: true,
                                })}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold leading-none bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                                    {issue.urgencyScore}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <select
                                    value={issue.status}
                                    onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 cursor-pointer dark:text-white"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
