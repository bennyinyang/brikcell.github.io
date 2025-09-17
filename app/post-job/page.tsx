import { JobPostingForm } from "@/components/jobs/job-posting-form"
import { Header } from "@/components/header"

export default function PostJobPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8">
        <JobPostingForm />
      </main>
    </div>
  )
}
