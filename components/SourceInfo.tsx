import type { Location } from "@/data/locations.schema";

interface SourceInfoProps {
    sources: Location["sources"];
    compact?: boolean;
}

export default function SourceInfo({ sources, compact = false }: SourceInfoProps) {
    if (!sources || sources.length === 0) {
        return <span className="text-sm text-gray-500 italic">No source information</span>;
    }

    if (compact && sources.length > 0) {
        const firstSource = sources[0];
        return (
            <div className="text-sm text-gray-600">
                <span className="font-medium">Source:</span>{" "}
                {firstSource.url ? (
                    <a
                        href={firstSource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        {firstSource.name}
                    </a>
                ) : (
                    <span>{firstSource.name}</span>
                )}
                {sources.length > 1 && (
                    <span className="text-gray-500"> +{sources.length - 1} more</span>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
                {sources.length === 1 ? "Source" : "Sources"}
            </p>
            <ul className="space-y-1.5">
                {sources
                    .sort((a, b) => {
                        // Sort live sources first
                        const aLive = !a.httpStatus || (a.httpStatus >= 200 && a.httpStatus < 300);
                        const bLive = !b.httpStatus || (b.httpStatus >= 200 && b.httpStatus < 300);
                        return aLive === bLive ? 0 : aLive ? -1 : 1;
                    })
                    .map((source, index) => {
                        const isDead = source.httpStatus && source.httpStatus >= 400;
                        const isLive = source.httpStatus && source.httpStatus >= 200 && source.httpStatus < 300;

                        return (
                            <li key={source.id || index} className="text-sm flex items-center justify-between group">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {/* Status Indicator */}
                                    {isLive && <span className="text-green-500 text-xs" title="Link active">●</span>}
                                    {isDead && <span className="text-red-500 text-xs" title="Link potentially broken">●</span>}
                                    {!source.httpStatus && <span className="text-gray-300 text-xs" title="Not checked">●</span>}

                                    {source.url ? (
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`truncate hover:underline inline-flex items-center gap-1
                                                ${isDead ? "text-gray-400 line-through decoration-gray-400" : "text-blue-600 hover:text-blue-800"}
                                            `}
                                        >
                                            <span className="truncate">{source.name}</span>
                                            {!isDead && <span className="text-xs">↗</span>}
                                        </a>
                                    ) : (
                                        <span className="text-gray-700 truncate">{source.name}</span>
                                    )}
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2 text-xs text-gray-400">
                                    {isDead && <span className="text-red-500 bg-red-50 px-1.5 rounded">Dead Link</span>}
                                    {source.lastChecked && (
                                        <span className="hidden group-hover:inline">
                                            Checked {new Date(source.lastChecked).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
            </ul>
        </div>
    );
}
