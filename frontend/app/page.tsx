'use client';

import useUserId from "./hooks/useUserId";
import useBriefing from "./hooks/useBriefing";
import useGenerateBriefing from "./hooks/useGenerateBriefing";
import StoryLink from "./components/StoryLink/StoryLink";

export default function Home() {
  // check in the local storate the userId value
  const userId = useUserId();
  const { briefing, loading, error, fetchBriefing } = useBriefing(userId);
  const { generateBriefing, loading: generateBriefingLoading, error: generateBriefingError } = useGenerateBriefing();

  const handleGenerateBriefing = async () => {
    if (!userId) return;
    await generateBriefing();
    await fetchBriefing(userId);
  };

  return (
    <div className="p-4">
      <main className="">
        <header className="border p-4 flex justify-between items-center rounded">
          <div>
            <h1 className="text-2xl font-bold">AI News Hub</h1>
            <p className="text-gray-500">AI News Hub is a web application that uses AI to generate news summaries and insights.</p>
          </div>
          <div>
            <button
              className="border hover:bg-gray-100 text-gray-800 px-4 py-2 rounded cursor-pointer"
              onClick={handleGenerateBriefing}
              disabled={generateBriefingLoading}
            >
              Generate brief {generateBriefingLoading && '...'}
            </button>
          </div>
        </header>

        <div className="py-4">
          {(() => {
            const today = new Date();
            const getDayWithSuffix = (day: number) => {
              if (day > 3 && day < 21) return day + 'th';
              switch (day % 10) {
                case 1: return day + 'st';
                case 2: return day + 'nd';
                case 3: return day + 'rd';
                default: return day + 'th';
              }
            };
            const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
            const month = today.toLocaleDateString('en-US', { month: 'long' });
            const day = getDayWithSuffix(today.getDate());
            const year = today.getFullYear();
            return <h2>{`${weekday}, ${month} ${day}, ${year}`}</h2>;
          })()}

          {briefing && briefing.stories && (
            <div className="grid grid-cols-3 gap-4 py-4">
              {briefing.stories.map((story) => (
                <StoryLink
                  key={story.id}
                  link={`/news/${story.id}`}
                  title={story.title}
                  sourceName={story.sourceName}
                />
              ))}
            </div>
          )}

          {(!loading && (!briefing || !briefing?.stories?.length)) && (
            <p>No stories found</p>
          )}
        </div>

      </main>
    </div>
  );
}
