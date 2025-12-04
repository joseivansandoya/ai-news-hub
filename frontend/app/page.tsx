import Link from "next/link";

export default async function Home() {
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
