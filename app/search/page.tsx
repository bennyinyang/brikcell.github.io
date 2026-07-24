import { Suspense } from "react"
import { Header } from "@/components/header"
import { SearchAndBrowse } from "@/components/search/search-and-browse"

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading…</div>}>
        <SearchAndBrowse />
      </Suspense>
    </div>
  )
}
