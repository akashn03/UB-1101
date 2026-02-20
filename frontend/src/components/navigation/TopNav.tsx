"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, User, MapPin } from "lucide-react";
import { signOut } from "@/app/actions/auth";

const navItems = [
    { href: "/", label: "Home" },
    { href: "/report", label: "Report Issue" },
    { href: "/profile", label: "Profile" },
];

export default function TopNav() {
    const pathname = usePathname();

    return (
        <nav className="hidden md:block sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
                        <MapPin size={18} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-foreground">
                        HealMyCity
                    </span>
                </Link>

                {/* Center nav links */}
                <div className="flex items-center gap-1">
                    {navItems.map(({ href, label }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                                        ? "bg-accent text-white shadow-md shadow-accent/25"
                                        : "text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5"
                                    }`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>

                {/* Sign out */}
                <form action={signOut}>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all duration-200"
                    >
                        Sign Out
                    </button>
                </form>
            </div>
        </nav>
    );
}
