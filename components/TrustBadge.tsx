import type { Location } from "@/data/locations.schema";

interface TrustBadgeProps {
    status: Location["status"];
    verifiedAt?: string;
    size?: "sm" | "md" | "lg";
    showTooltip?: boolean;
}

export default function TrustBadge({
    status,
    verifiedAt,
    size = "md",
    showTooltip = true
}: TrustBadgeProps) {
    const getStatusInfo = () => {
        switch (status) {
            case "active":
                return {
                    label: "Verified",
                    color: "bg-green-100 text-green-800 border-green-300",
                    icon: "✓",
                    tooltip: "This location has been verified and is currently active"
                };
            case "unverified":
                return {
                    label: "Unverified",
                    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
                    icon: "○",
                    tooltip: "This location has not been verified yet. Information may be outdated."
                };
            case "reported_closed":
                return {
                    label: "Reported Closed",
                    color: "bg-red-100 text-red-800 border-red-300",
                    icon: "✕",
                    tooltip: "This location has been reported as closed. Please verify before visiting."
                };
        }
    };

    const sizeClasses = {
        sm: "text-xs px-1.5 py-0.5",
        md: "text-sm px-2 py-1",
        lg: "text-base px-3 py-1.5"
    };

    const info = getStatusInfo();

    return (
        <div className="relative inline-block group">
            <span
                className={`inline-flex items-center gap-1 rounded-full border font-medium ${info.color} ${sizeClasses[size]}`}
                title={showTooltip ? info.tooltip : undefined}
            >
                <span>{info.icon}</span>
                <span>{info.label}</span>
            </span>

            {/* Tooltip on hover (desktop) */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                        {info.tooltip}
                        {verifiedAt && status === "active" && (
                            <div className="mt-1 text-gray-300">
                                Last verified: {new Date(verifiedAt).toLocaleDateString()}
                            </div>
                        )}
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
