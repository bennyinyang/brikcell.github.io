"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label";
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, MapPin, DollarSign, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { getAuth, createJobPosting } from "@/lib/api";  // Importing the correct methods

const serviceCategories = [
  "Plumbing", "Carpentry", "Hair Styling", "Electrical", "Painting",
  "Auto Repair", "House Cleaning", "Tech Support", "Landscaping", "Moving Services"
];

export function JobPostingForm() {

  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(() => {
  const auth = getAuth()
    return !!auth?.token
  })

  useEffect(() => {
    const auth = getAuth()
    if (auth) {
      setToken(auth.token)
    }
    setIsLoading(false)  
  }, [])

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    budgetMin: "",
    budgetMax: "",
    images: [] as File[],
    status: "open",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 5), // Max 5 images
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (!token) {
      console.error("Auth token missing");
      return;
    }

    try {
      // Constructing the job data to send to the backend
      const jobData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        budget_min: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budget_max: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
        status: formData.status,
        images: formData.images, // If images need to be uploaded
      };

      // Call the createJobPosting API function
      await createJobPosting(jobData, token);  // Ensure token is passed correctly

      console.log("Job successfully posted");
      toast.success("Profile updated successfully")
      router.push("/dashboard/customer")
    } catch (err) {
      console.error("Failed to post job:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  if (isLoading) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Job</h1>
        <p className="text-gray-600">Tell us about your project and find the perfect artisan</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-gray-600">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Job Details"}
              {currentStep === 2 && "Location & Timeline"}
              {currentStep === 3 && "Budget & Requirements"}
              {currentStep === 4 && "Review & Submit"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Fix leaking kitchen faucet"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Service Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project in detail. Include what needs to be done, any specific requirements, and what materials might be needed."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={5}
                    required
                  />
                </div>
              </div>
            )}

            {/* Location & Timeline */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="location"
                      placeholder="Enter your address or area"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Budget & Requirements */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">Minimum Budget *</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budgetMin: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetMax">Maximum Budget *</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budgetMax: e.target.value }))}
                    required
                  />
                </div>
              </div>
            )}

            {/* Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 font-medium">Review your job posting before submitting:</p>
                <div className="rounded-lg border p-4 space-y-2 text-sm">
                  <div><span className="font-medium">Title:</span> {formData.title}</div>
                  <div><span className="font-medium">Category:</span> {formData.category}</div>
                  <div><span className="font-medium">Location:</span> {formData.location}</div>
                  <div><span className="font-medium">Description:</span> {formData.description}</div>
                  <div><span className="font-medium">Budget:</span> {formData.budgetMin && formData.budgetMax ? `₦${formData.budgetMin} – ₦${formData.budgetMax}` : "Not set"}</div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving || !formData.title || !formData.location || !formData.category}
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    Complete Job Posting
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}