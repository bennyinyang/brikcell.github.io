"use client"

import type { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"

// Utility functions for different types of notifications
export const showSuccessToast = (toast: ReturnType<typeof useToast>["toast"], title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "default",
    action: <CheckCircle className="h-4 w-4 text-green-600" />,
  })
}

export const showErrorToast = (toast: ReturnType<typeof useToast>["toast"], title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "destructive",
    action: <XCircle className="h-4 w-4 text-red-600" />,
  })
}

export const showInfoToast = (toast: ReturnType<typeof useToast>["toast"], title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "default",
    action: <Info className="h-4 w-4 text-blue-600" />,
  })
}

export const showWarningToast = (toast: ReturnType<typeof useToast>["toast"], title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "default",
    action: <AlertCircle className="h-4 w-4 text-orange-600" />,
  })
}

// Pre-configured notification messages for common actions
export const NotificationMessages = {
  JOB_POSTED: {
    title: "Job Posted Successfully!",
    description: "Your job is now live and artisans can start applying.",
  },
  APPLICATION_SENT: {
    title: "Application Submitted!",
    description: "Your application has been sent to the customer.",
  },
  MESSAGE_SENT: {
    title: "Message Sent!",
    description: "Your message has been delivered successfully.",
  },
  PROFILE_UPDATED: {
    title: "Profile Updated!",
    description: "Your profile changes have been saved.",
  },
  PAYMENT_SUCCESSFUL: {
    title: "Payment Successful!",
    description: "Your payment has been processed successfully.",
  },
  REVIEW_SUBMITTED: {
    title: "Review Submitted!",
    description: "Thank you for your feedback.",
  },
  ERROR_GENERIC: {
    title: "Something went wrong",
    description: "Please try again or contact support if the problem persists.",
  },
  NETWORK_ERROR: {
    title: "Connection Error",
    description: "Please check your internet connection and try again.",
  },
}
