import { createClient } from "@/lib/supabase/server";
import HomeFeed from "@/components/feed/HomeFeed";

export default async function HomePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Fetch issues ordered by most recent
    const { data: issues } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false });

    // Fetch current user's votes to highlight upvoted issues
    let userVotes: string[] = [];
    if (user) {
        const { data: votes } = await supabase
            .from("votes")
            .select("issue_id")
            .eq("user_id", user.id);

        userVotes = (votes || []).map((v: { issue_id: string }) => v.issue_id);
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Recent Issues
                </h1>
                <p className="text-muted text-sm mt-1">
                    See what&apos;s happening in your city
                </p>
            </div>

            {/* Feed */}
            <HomeFeed
                issues={issues || []}
                userVotes={userVotes}
                userId={user?.id || ""}
            />
        </div>
    );
}
