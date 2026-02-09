interface LastUpdatedProps {
    date?: string;
    prefix?: string;
}

export default function LastUpdated({ date, prefix = "Last updated" }: LastUpdatedProps) {
    if (!date) {
        return <span className="text-sm text-gray-500">Not verified</span>;
    }

    const getRelativeTime = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now.getTime() - past.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffDays === 0) return "today";
        if (diffDays === 1) return "yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffWeeks === 1) return "1 week ago";
        if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
        if (diffMonths === 1) return "1 month ago";
        if (diffMonths < 12) return `${diffMonths} months ago`;
        if (diffYears === 1) return "1 year ago";
        return `${diffYears} years ago`;
    };

    const relativeTime = getRelativeTime(date);
    const isOld = new Date(date).getTime() < Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days

    return (
        <span
            className={`text-sm ${isOld ? "text-amber-600" : "text-gray-600"}`}
            title={new Date(date).toLocaleDateString()}
        >
            {prefix} {relativeTime}
            {isOld && " ⚠️"}
        </span>
    );
}
