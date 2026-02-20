import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Map as MapIcon, LogOut, ArrowLeft } from "lucide-react";
import { signOut } from "@/app/actions/auth";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // Auth check
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Role check
    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        redirect("/"); // Not an admin
    }

    return (
        <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex">
                {/* Brand */}
                <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-sm">
                            H
                        </div>
                        Admin Portal
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <LayoutDashboard size={18} />
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/map"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <MapIcon size={18} />
                        Live Map View
                    </Link>
                </nav>

                {/* Footer actions */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Citizen App
                    </Link>
                    <form action={signOut}>
                        <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header (fallback) */}
                <header className="md:hidden h-16 bg-white border-b flex items-center px-4 justify-between">
                    <div className="font-bold text-lg">Admin Portal</div>
                    <Link href="/admin/map" className="text-sm font-medium text-blue-600">
                        Map
                    </Link>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
