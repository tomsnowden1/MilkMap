"use client";

import { useState } from "react";

interface FeedbackButtonsProps {
    locationId: string;
}

export default function FeedbackButtons({ locationId }: FeedbackButtonsProps) {
    const [showComment, setShowComment] = useState(false);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleVote = async (vote: "up" | "down") => {
        setSubmitting(true);

        try {
            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locationId,
                    vote,
                    comment: comment.trim() || undefined,
                }),
            });

            const result = await response.json();

            if (result.issueUrl || result.fallbackUrl) {
                // If we got a URL (either created issue or fallback), open it
                const url = result.issueUrl || result.fallbackUrl;
                window.open(url, "_blank");
                setSubmitted(true);
                setComment("");
                setShowComment(false);
            }
        } catch (error) {
            console.error("Failed to submit feedback:", error);
            alert("Failed to submit feedback. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="text-center py-4 text-green-600">
                ✓ Thank you for your feedback!
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Still there?</h3>
            <p className="text-xs text-gray-600">
                Help keep data accurate by confirming this location
            </p>

            <div className="flex gap-3">
                <button
                    onClick={() => {
                        setShowComment(!showComment);
                        if (!showComment) handleVote("up");
                    }}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 text-2xl"
                >
                    👍
                </button>
                <button
                    onClick={() => setShowComment(!showComment)}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 text-2xl"
                >
                    👎
                </button>
            </div>

            {showComment && (
                <div className="space-y-2">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Optional: Add details about what's changed..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                    />
                    <button
                        onClick={() => handleVote("down")}
                        disabled={submitting}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Submitting..." : "Submit Report"}
                    </button>
                </div>
            )}
        </div>
    );
}
