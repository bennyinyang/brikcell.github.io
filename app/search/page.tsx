import { Header } from "@/components/header"
import { SearchAndBrowse } from "@/components/search/search-and-browse"

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SearchAndBrowse />
    </div>
  )
}
