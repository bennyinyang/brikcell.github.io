"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, User, Camera, FileText, Award } from "lucide-react"
import Link from "next/link"

interface ProfileCompletionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userType: "customer" | "artisan"
  completionData: {
    percentage: number
    completedSteps: string[]
    missingSteps: string[]
  }
}

export function ProfileCompletionModal({ open, onOpenChange, userType, completionData }: ProfileCompletionModalProps) {
  const steps = {
    customer: [
      { id: "basic-info", label: "Basic Information", icon: User },
      { id: "profile-photo", label: "Profile Photo", icon: Camera },
      { id: "preferences", label: "Service Preferences", icon: FileText },
    ],
    artisan: [
      { id: "basic-info", label: "Basic Information", icon: User },
      { id: "profile-photo", label: "Profile Photo", icon: Camera },
      { id: "skills", label: "Skills & Services", icon: FileText },
      { id: "portfolio", label: "Portfolio", icon: Award },
      { id: "verification", label: "Identity Verification", icon: CheckCircle },
    ],
  }

  const currentSteps = steps[userType]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <AlertCircle className="h-5 w-5" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            {userType === "artisan"
              ? "Complete your profile to start receiving job applications and build trust with customers."
              : "Complete your profile to get better recommendations and connect with artisans."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Profile Completion</span>
              <span className="font-medium">{completionData.percentage}%</span>
            </div>
            <Progress value={completionData.percentage} className="h-2" />
          </div>

          <div className="space-y-2">
            {currentSteps.map((step) => {
              const isCompleted = completionData.completedSteps.includes(step.id)
              const Icon = step.icon

              return (
                <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  <div className={`p-1 rounded-full ${isCompleted ? "bg-green-100" : "bg-gray-200"}`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Icon className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <span className={`text-sm ${isCompleted ? "text-green-700 line-through" : "text-gray-700"}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {userType === "artisan" && completionData.percentage < 80 && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary/80">
                <strong>Tip:</strong> Profiles with 80%+ completion get 3x more job applications!
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Later
          </Button>
          <Link href="/profile/setup">
            <Button className="bg-primary hover:bg-primary/90">Complete Profile</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
