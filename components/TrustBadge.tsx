import type { Location } from "@/data/locations.schema";

interface TrustBadgeProps {
    status?: Location["status"];
    level?: Location["verificationLevel"];
    verifiedAt?: string;
    size?: "sm" | "md" | "lg";
    showTooltip?: boolean;
}

export default function TrustBadge({
    status,
    level,
    verifiedAt,
    size = "md",
    showTooltip = true
}: TrustBadgeProps) {
    const getStatusInfo = () => {
        // Closed takes precedence
        if (status === "reported_closed") {
            return {
                label: "Reported Closed",
                color: "bg-red-100 text-red-800 border-red-300",
                icon: "✕",
                tooltip: "This location has been reported as closed. Please verify before visiting."
            };
        }

        // Verification Levels
        if (level === "verified") {
            return {
                label: "Verified",
                color: "bg-green-100 text-green-800 border-green-300",
                icon: "✓",
                tooltip: "This location has been verified by independent sources."
            };
        }

        if (level === "user-reported") {
            return {
                label: "User Reported",
                color: "bg-blue-100 text-blue-800 border-blue-300",
                icon: "👤",
                tooltip: "Reported by a user but not fully verified."
            };
        }

        // Fallback or explicit unverified
        return {
            label: "Unverified",
            color: "bg-yellow-100 text-yellow-800 border-yellow-300",
            icon: "○",
            tooltip: "This location has not been verified yet. Information may be outdated."
        };
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
