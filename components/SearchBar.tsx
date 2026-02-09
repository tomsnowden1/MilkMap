"use client";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onNearMeClick?: () => void;
    isLocating?: boolean;
}

export default function SearchBar({
    value,
    onChange,
    onNearMeClick,
    isLocating = false,
}: SearchBarProps) {
    return (
        <div className="relative flex gap-2">
            <div className="relative flex-1">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Search by venue name or address..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {value && (
                    <button
                        onClick={() => onChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>
            <button
                onClick={onNearMeClick}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2 whitespace-nowrap"
                title="Use my location"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isLocating ? "animate-spin" : ""}
                >
                    {isLocating ? (
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    ) : (
                        <>
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </>
                    )}
                    {!isLocating && <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />}
                </svg>
                <span className="hidden sm:inline">Near Me</span>
            </button>
        </div>
    );
}
