'use client';

import Link from "next/link";

import useUserId from "./hooks/useUserId";
import useBriefing from "./hooks/useBriefing";

export default function Home() {
  // check in the local storate the userId value
  const userId = useUserId();
  const { briefing, loading, error } = useBriefing(userId);

  console.log('>>> userId', userId);
  console.log('>>> briefing', briefing);

  return (
    <div className="p-4">
      <main className="">
        <header className="border p-4 flex justify-between items-center rounded">
          <div>
            <h1>AI News Hub</h1>
            <p>AI News Hub is a web application that uses AI to generate news summaries and insights.</p>
          </div>
          <div>
            <button className="border hover:bg-gray-100 text-gray-800 px-4 py-2 rounded cursor-pointer">Generate brief</button>
          </div>
        </header>

        <div className="p-4">
          <h2>Wednesday, December 3rd, 2025</h2>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Link href="/news/1" className="border p-4 rounded">News Item 1</Link>
            <Link href="/news/2" className="border p-4 rounded">News Item 2</Link>
            <Link href="/news/3" className="border p-4 rounded">News Item 3</Link>
            <Link href="/news/4" className="border p-4 rounded">News Item 4</Link>
            <Link href="/news/5" className="border p-4 rounded">News Item 5</Link>
            <Link href="/news/6" className="border p-4 rounded">News Item 6</Link>
          </div>
        </div>

      </main>
    </div>
  );
}
