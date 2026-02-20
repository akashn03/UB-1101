import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { User, Mail, Shield, Calendar } from "lucide-react";

export default async function ProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

    // Count user's issues
    const { count: issueCount } = await supabase
        .from("issues")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    return (
        <div className="max-w-lg mx-auto px-4 py-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-6">
                Profile
            </h1>

            {/* Profile card */}
            <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-accent/25">
                        {(profile?.full_name || user.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {profile?.full_name || "Anonymous"}
                        </h2>
                        <p className="text-sm text-muted">{profile?.role || "citizen"}</p>
                    </div>
                </div>

                {/* Info rows */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 text-sm">
                        <Mail size={16} className="text-muted-light" />
                        <span className="text-foreground">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Shield size={16} className="text-muted-light" />
                        <span className="text-foreground capitalize">
                            {profile?.role || "citizen"}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Calendar size={16} className="text-muted-light" />
                        <span className="text-foreground">
                            Joined{" "}
                            {new Date(user.created_at).toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                            })}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">
                            {issueCount || 0}
                        </p>
                        <p className="text-xs text-muted font-medium mt-1">
                            Issues Reported
                        </p>
                    </div>
                </div>

                {/* Sign out */}
                <form action={signOut}>
                    <button
                        type="submit"
                        className="w-full py-3 text-sm font-medium text-red-500 hover:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/15 rounded-xl transition-all duration-200"
                    >
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    );
}
