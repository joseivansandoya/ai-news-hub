import Link from "next/link";

interface StoryLinkProps {
  link: string;
  title: string;  
  sourceName: string;
}

export default function StoryLink ({ link, title, sourceName }: StoryLinkProps) {
  return (
    <Link href={link} className="border p-4 rounded hover:bg-gray-100">
      <h2 className="font-bold">{title}</h2>
      <p className="text-gray-500 text-sm mt-2">{sourceName}</p>
    </Link>
  );
}
