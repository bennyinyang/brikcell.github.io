"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, FileText, Package, Wrench, DollarSign, Calendar, AlertCircle, Send } from "lucide-react"

interface Phase {
  id: string
  name: string
  description: string
  deliverables: string[]
  amount: number
  dueDate: string
}

interface Material {
  id: string
  name: string
  cost: number
  coveredBy: "client" | "artisan"
}

interface ContractCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSendContract: (contract: any) => void
}

export function ContractCreationModal({ open, onOpenChange, onSendContract }: ContractCreationModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [phases, setPhases] = useState<Phase[]>([
    {
      id: "1",
      name: "",
      description: "",
      deliverables: [""],
      amount: 0,
      dueDate: "",
    },
  ])
  const [materials, setMaterials] = useState<Material[]>([])
  const [depositPercentage, setDepositPercentage] = useState(30)
  const [currentDeliverable, setCurrentDeliverable] = useState<{ [key: string]: string }>({})

  const addPhase = () => {
    const newPhase: Phase = {
      id: Date.now().toString(),
      name: "",
      description: "",
      deliverables: [""],
      amount: 0,
      dueDate: "",
    }
    setPhases([...phases, newPhase])
  }

  const removePhase = (id: string) => {
    if (phases.length > 1) {
      setPhases(phases.filter((phase) => phase.id !== id))
    }
  }

  const updatePhase = (id: string, field: keyof Phase, value: any) => {
    setPhases(phases.map((phase) => (phase.id === id ? { ...phase, [field]: value } : phase)))
  }

  const addDeliverable = (phaseId: string) => {
    setPhases(
      phases.map((phase) => (phase.id === phaseId ? { ...phase, deliverables: [...phase.deliverables, ""] } : phase)),
    )
  }

  const updateDeliverable = (phaseId: string, index: number, value: string) => {
    setPhases(
      phases.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              deliverables: phase.deliverables.map((d, i) => (i === index ? value : d)),
            }
          : phase,
      ),
    )
  }

  const removeDeliverable = (phaseId: string, index: number) => {
    setPhases(
      phases.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              deliverables: phase.deliverables.filter((_, i) => i !== index),
            }
          : phase,
      ),
    )
  }

  const addMaterial = () => {
    const newMaterial: Material = {
      id: Date.now().toString(),
      name: "",
      cost: 0,
      coveredBy: "client",
    }
    setMaterials([...materials, newMaterial])
  }

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter((material) => material.id !== id))
  }

  const updateMaterial = (id: string, field: keyof Material, value: any) => {
    setMaterials(materials.map((material) => (material.id === id ? { ...material, [field]: value } : material)))
  }

  const calculateTotalAmount = () => {
    return phases.reduce((sum, phase) => sum + (phase.amount || 0), 0)
  }

  const calculateDepositAmount = () => {
    return Math.round((calculateTotalAmount() * depositPercentage) / 100)
  }

  const calculateMaterialsCost = () => {
    return materials.reduce((sum, material) => sum + (material.cost || 0), 0)
  }

  const handleSendContract = async () => {
    const contract = {
      id: Date.now(),
      title,
      description,
      totalAmount: calculateTotalAmount(),
      depositAmount: calculateDepositAmount(),
      depositPaid: false,
      status: "proposed",
      createdAt: new Date().toISOString(),
      phases: phases.map((phase, index) => ({
        id: index + 1,
        name: phase.name,
        description: phase.description,
        deliverables: phase.deliverables.filter((d) => d.trim() !== ""),
        amount: phase.amount,
        status: "pending",
        dueDate: phase.dueDate,
      })),
      materials: materials.map((material, index) => ({
        id: index + 1,
        name: material.name,
        cost: material.cost,
        coveredBy: material.coveredBy,
      })),
    }

    await onSendContract(contract)
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setPhases([
      {
        id: "1",
        name: "",
        description: "",
        deliverables: [""],
        amount: 0,
        dueDate: "",
      },
    ])
    setMaterials([])
    setDepositPercentage(30)
  }

  const isFormValid = () => {
    return (
      title.trim() !== "" &&
      description.trim() !== "" &&
      phases.every((phase) => phase.name.trim() !== "" && phase.amount > 0) &&
      calculateTotalAmount() > 0
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center text-xl">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            Create Contract Proposal
          </DialogTitle>
          <DialogDescription>
            Create a detailed contract with phases, deliverables, and materials for your client to review.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          <div className="space-y-6 pb-6">
            {/* Project Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Project Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Kitchen Plumbing Repair & Faucet Replacement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Project Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the work to be done..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 min-h-[100px]"
                />
              </div>
            </div>

            <Separator />

            {/* Phases */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-semibold">Project Phases *</h3>
                </div>
                <Button onClick={addPhase} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Phase
                </Button>
              </div>

              <div className="space-y-4">
                {phases.map((phase, phaseIndex) => (
                  <Card key={phase.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary">Phase {phaseIndex + 1}</Badge>
                        {phases.length > 1 && (
                          <Button
                            onClick={() => removePhase(phase.id)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Phase Name *</Label>
                          <Input
                            placeholder="e.g., Initial Assessment & Preparation"
                            value={phase.name}
                            onChange={(e) => updatePhase(phase.id, "name", e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Phase Description</Label>
                          <Textarea
                            placeholder="Describe what will be done in this phase..."
                            value={phase.description}
                            onChange={(e) => updatePhase(phase.id, "description", e.target.value)}
                            className="mt-1 min-h-[60px]"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs">Deliverables</Label>
                            <Button
                              onClick={() => addDeliverable(phase.id)}
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {phase.deliverables.map((deliverable, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Input
                                  placeholder="e.g., Detailed assessment report"
                                  value={deliverable}
                                  onChange={(e) => updateDeliverable(phase.id, index, e.target.value)}
                                  className="text-sm"
                                />
                                {phase.deliverables.length > 1 && (
                                  <Button
                                    onClick={() => removeDeliverable(phase.id, index)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Amount (₦) *</Label>
                            <div className="relative mt-1">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="number"
                                placeholder="0"
                                value={phase.amount || ""}
                                onChange={(e) => updatePhase(phase.id, "amount", Number(e.target.value))}
                                className="pl-9"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Due Date</Label>
                            <div className="relative mt-1">
                              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="date"
                                value={phase.dueDate}
                                onChange={(e) => updatePhase(phase.id, "dueDate", e.target.value)}
                                className="pl-9"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Materials & Tools */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Wrench className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-semibold">Materials & Tools</h3>
                </div>
                <Button onClick={addMaterial} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </div>

              {materials.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                  <Wrench className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">No materials added yet</p>
                  <p className="text-xs text-gray-500 mt-1">Add materials and specify who covers the cost</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <Card key={material.id} className="border">
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Material/Tool name"
                              value={material.name}
                              onChange={(e) => updateMaterial(material.id, "name", e.target.value)}
                              className="text-sm"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Cost (₦)</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={material.cost || ""}
                                  onChange={(e) => updateMaterial(material.id, "cost", Number(e.target.value))}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Covered By</Label>
                                <Select
                                  value={material.coveredBy}
                                  onValueChange={(value) => updateMaterial(material.id, "coveredBy", value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="client">Client</SelectItem>
                                    <SelectItem value="artisan">Artisan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeMaterial(material.id)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Deposit */}
            <div>
              <div className="flex items-center mb-3">
                <DollarSign className="h-5 w-5 mr-2 text-primary" />
                <h3 className="font-semibold">Deposit</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm">Deposit Percentage</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={depositPercentage}
                      onChange={(e) => setDepositPercentage(Number(e.target.value))}
                      className="w-20 text-center"
                    />
                    <span className="text-sm font-medium">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Deposit Amount:</span>
                  <span className="text-lg font-bold text-primary">₦{calculateDepositAmount().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Contract Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Phases:</span>
                  <span className="font-semibold">{phases.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Materials Cost:</span>
                  <span className="font-semibold">₦{calculateMaterialsCost().toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Labor Cost:</span>
                  <span className="font-semibold">₦{calculateTotalAmount().toLocaleString()}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Contract Value:</span>
                  <span className="text-2xl font-bold text-primary">
                    ₦{(calculateTotalAmount() + calculateMaterialsCost()).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {!isFormValid() && (
              <div className="flex items-start space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-800">
                  Please fill in all required fields: project title, description, phase names, and phase amounts.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t px-6 py-4 flex items-center justify-between bg-gray-50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendContract} disabled={!isFormValid()} className="bg-primary hover:bg-primary/90">
            <Send className="h-4 w-4 mr-2" />
            Send Contract
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
