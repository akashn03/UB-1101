import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TopNav from "@/components/navigation/TopNav";
import BottomNav from "@/components/navigation/BottomNav";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Protect all routes under this layout — require auth
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-background">
            <TopNav />
            <main className="pb-safe md:pb-0">{children}</main>
            <BottomNav />
        </div>
    );
}
