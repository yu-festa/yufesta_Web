export default function ResourceStatus({ loading, error, retry }: { loading: boolean; error: string; retry: () => Promise<void> }) {
  if (error) return <div role="alert" className="my-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}<button type="button" disabled={loading} onClick={() => void retry()} className="ml-2 underline disabled:opacity-50">다시 불러오기</button></div>
  if (loading) return <p role="status" className="py-4 text-sm text-[#63708a]">불러오는 중…</p>
  return null
}
