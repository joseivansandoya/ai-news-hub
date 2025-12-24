'use client';

import Link from "next/link";
import { use } from "react";
import useUserId from "../../hooks/useUserId";
import useStory from "../../hooks/useStory";

export default function NewsItem(props: PageProps<'/news/[id]'>) {
  const { id } = use(props.params);
  const userId = useUserId();
  const { story, loading, error } = useStory(id, userId);

  return (
    <div className="p-4 flex gap-4">
      <div className="border p-4 rounded w-64">
        <Link href="/">AI News Hub</Link>
      </div>
      <div className="flex-1 border p-4 rounded">
        {(!loading && !story) ? (
          <p>Story not found</p>
        ) : (
          <div>
            <h1>News Title - {story?.title}</h1>
            <p>News date - {story?.publishedAt?.toString() ?? ''}</p>
            <p>News source - {story?.sourceName}</p>
            <p>News image - {story?.coverImageUrl}</p>
            <p>News content - {story?.content?.join('') ?? ''}</p>
          </div>
        )}
      </div>
    </div>
  )
}
