import { createClient } from "@/lib/supabase/server";
import MapWrapper from "@/components/admin/MapWrapper";

export default async function AdminMapPage() {
    const supabase = await createClient();

    // Fetch only open issues that have coordinates
    const { data: issues } = await supabase
        .from("issues")
        .select("*")
        .eq("status", "open")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Live Map View
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Geospatial visualization of all open civic issues. Marker sizing correlates with upvotes.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-2">
                <MapWrapper issues={issues || []} />
            </div>
        </div>
    );
}
