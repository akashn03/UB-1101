"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, User } from "lucide-react";

const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/report", label: "Report", icon: Camera },
    { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4"
                    style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
                >
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 ${isActive
                                        ? "text-accent bg-accent-light"
                                        : "text-muted hover:text-foreground"
                                    }`}
                            >
                                <Icon
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                />
                                <span className="text-[10px] font-semibold tracking-wide">
                                    {label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
