import { JobPostingForm } from "@/components/jobs/job-posting-form"
import { Header } from "@/components/header"

export default function PostJobPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <JobPostingForm />
      </main>
    </div>
  )
}