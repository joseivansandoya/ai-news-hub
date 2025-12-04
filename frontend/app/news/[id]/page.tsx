export default async function NewsItem(props: PageProps<'/news/[id]'>) {
  const { id } = await props.params;

  return (
    <div className="p-4 flex gap-4">
      <div className="border p-4 rounded w-64">
        <p>Sidebar</p>
      </div>
      <div className="flex-1 border p-4 rounded">
        <h1>News Title - {id}</h1>
        <p>News date</p>
        <p>News source</p>
        <p>News image</p>
        <p>News content</p>
      </div>
    </div>
  )
}
