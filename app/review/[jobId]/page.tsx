import { ReviewInterface } from "@/components/review/review-interface"

interface ReviewPageProps {
  params: {
    jobId: string
  }
}

export default function ReviewPage({ params }: ReviewPageProps) {
  return <ReviewInterface jobId={params.jobId} />
}
