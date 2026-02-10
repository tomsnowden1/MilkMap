import type { Location } from "@/data/locations.schema";

interface SourceInfoProps {
    sources: Location["sources"];
    compact?: boolean;
}

export default function SourceInfo({ sources, compact = false }: SourceInfoProps) {
    if (!sources || !Array.isArray(sources) || sources.length === 0) {
        return <span className="text-sm text-gray-500 italic">No source information</span>;
    }

    const activeSources = sources.filter(s => {
        // Hide dead sources unless in debug/dev mode? 
        // Requirement: "if a source becomes 404 later, hide the link and mark stale"
        if (s.httpStatus && s.httpStatus >= 400) return false;
        return true;
    });

    const evidenceSources = activeSources.filter(s => s.type === "evidence" || s.isOfficial);
    const relatedLinks = activeSources.filter(s => s.type !== "evidence" && !s.isOfficial);

    if (activeSources.length === 0) {
        return <span className="text-sm text-gray-500 italic">No active sources</span>;
    }

    if (compact) {
        // Compact view: Just show count or first official
        const primary = evidenceSources[0] || relatedLinks[0];
        return (
            <div className="text-sm text-gray-600">
                <span className="font-medium">Source:</span>{" "}
                {primary.url ? (
                    <a
                        href={primary.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        {primary.name}
                    </a>
                ) : (
                    <span>{primary.name}</span>
                )}
                {activeSources.length > 1 && (
                    <span className="text-gray-500"> +{activeSources.length - 1} more</span>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {evidenceSources.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span>Evidence Verified</span>
                        <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full">
                            {evidenceSources.length}
                        </span>
                    </p>
                    <ul className="space-y-1.5">
                        {evidenceSources.map((source, index) => (
                            <SourceItem key={source.id || index} source={source} isEvidence />
                        ))}
                    </ul>
                </div>
            )}

            {relatedLinks.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Related Links</p>
                    <ul className="space-y-1.5">
                        {relatedLinks.map((source, index) => (
                            <SourceItem key={source.id || index} source={source} />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function SourceItem({ source, isEvidence }: { source: any, isEvidence?: boolean }) {
    const isOfficial = source.isOfficial;

    return (
        <li className="text-sm flex items-center justify-between group">
            <div className="flex items-center gap-2 overflow-hidden">
                {/* Icon */}
                {isOfficial ? (
                    <span className="text-blue-500" title="Official Source">🛡️</span>
                ) : isEvidence ? (
                    <span className="text-green-500" title="Verified Evidence">✓</span>
                ) : (
                    <span className="text-gray-400" title="Related Link">🔗</span>
                )}

                {source.url ? (
                    <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        <span className="truncate">{source.name}</span>
                        <span className="text-xs ml-1">↗</span>
                    </a>
                ) : (
                    <span className="text-gray-700 truncate">{source.name}</span>
                )}
            </div>

            {source.lastChecked && (
                <span className="text-xs text-gray-400 hidden group-hover:inline">
                    {new Date(source.lastChecked).toLocaleDateString()}
                </span>
            )}
        </li>
    );
}
