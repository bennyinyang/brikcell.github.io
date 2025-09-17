"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  maxFiles?: number
  onUpload: (files: File[]) => Promise<void>
}

export function ImageUploadModal({
  open,
  onOpenChange,
  title,
  description,
  maxFiles = 5,
  onUpload,
}: ImageUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `You can only upload up to ${maxFiles} images.`,
        variant: "destructive",
      })
      return
    }

    const newFiles = [...selectedFiles, ...files]
    setSelectedFiles(newFiles)

    // Create previews
    const newPreviews = [...previews]
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        setPreviews([...newPreviews])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setPreviews(newPreviews)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one image to upload.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      await onUpload(selectedFiles)
      toast({
        title: "Upload Successful!",
        description: `${selectedFiles.length} image(s) uploaded successfully.`,
        variant: "default",
      })
      setSelectedFiles([])
      setPreviews([])
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <ImageIcon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Click to select images or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each (max {maxFiles} files)</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedFiles.length > 0 && <p className="text-sm text-gray-600">{selectedFiles.length} file(s) selected</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} Image(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
