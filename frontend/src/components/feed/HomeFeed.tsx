"use client";

import { useState } from "react";
import IssueCard from "./IssueCard";

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

interface HomeFeedProps {
    issues: Issue[];
    userVotes: string[];
    userId: string;
}

export default function HomeFeed({ issues, userVotes, userId }: HomeFeedProps) {
    const [issueList, setIssueList] = useState(issues);
    const [votedIds, setVotedIds] = useState<Set<string>>(new Set(userVotes));

    function handleVoteToggle(issueId: string, newCount: number, voted: boolean) {
        // Optimistic UI update
        setIssueList((prev) =>
            prev.map((issue) =>
                issue.id === issueId
                    ? { ...issue, upvote_count: newCount }
                    : issue
            )
        );
        setVotedIds((prev) => {
            const next = new Set(prev);
            if (voted) {
                next.add(issueId);
            } else {
                next.delete(issueId);
            }
            return next;
        });
    }

    if (issueList.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <span className="text-4xl">🏙️</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    No issues reported yet
                </h3>
                <p className="text-muted text-sm max-w-xs mx-auto">
                    Be the first to report a civic issue in your city. Tap the Report tab to get started!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {issueList.map((issue) => (
                <IssueCard
                    key={issue.id}
                    issue={issue}
                    isVoted={votedIds.has(issue.id)}
                    userId={userId}
                    onVoteToggle={handleVoteToggle}
                />
            ))}
        </div>
    );
}
