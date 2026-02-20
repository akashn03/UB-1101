import { createClient } from "@/lib/supabase/server";
import IssueTable from "@/components/admin/IssueTable";

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Fetch all open and in_progress issues
    const { data: issues } = await supabase
        .from("issues")
        .select("*")
        .in("status", ["open", "in_progress"]);

    // Calculate Urgency Score and shape data
    const processedIssues = (issues || []).map((issue) => {
        const sev = issue.ai_severity_score || 0;
        const votes = issue.upvote_count || 0;
        const urgencyScore = sev * 10 + votes;

        return {
            ...issue,
            urgencyScore,
        };
    });

    // Sort by urgency descending
    processedIssues.sort((a, b) => b.urgencyScore - a.urgencyScore);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Issues Triage
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Manage and prioritize reported civic issues based on computed urgency.
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg shadow-sm">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Active Issues: <strong className="text-slate-900 dark:text-white">{processedIssues.length}</strong>
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <IssueTable initialIssues={processedIssues} />
            </div>
        </div>
    );
}
