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
                {sources.length === 1 ? "Source" : "Sources"}:
            </p>
            <ul className="space-y-1.5">
                {sources.map((source, index) => (
                    <li key={index} className="text-sm">
                        {source.url ? (
                            <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                            >
                                <span>{source.name}</span>
                                <span className="text-xs">↗</span>
                            </a>
                        ) : (
                            <span className="text-gray-700">{source.name}</span>
                        )}
                        {source.extractedAt && (
                            <span className="text-xs text-gray-500 ml-2">
                                ({new Date(source.extractedAt).toLocaleDateString()})
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
