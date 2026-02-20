"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("./MapComponent"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[600px] flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
                <span className="text-sm font-medium text-slate-500">Loading map data...</span>
            </div>
        </div>
    ),
});

export default function MapWrapper({ issues }: { issues: any }) {
    return <LiveMap issues={issues} />;
}
