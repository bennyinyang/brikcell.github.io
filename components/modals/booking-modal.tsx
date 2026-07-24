"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  NotebookPen,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  createBooking,
  getContractState,
  listBookingsWithParticipant,
  modifyBooking,
  type BookingDTO,
  type UserDTO,
} from "@/lib/api"

type ContractCandidate = {
  id: string | number
  title?: string | null
}

const EMPTY_CONTRACT_CANDIDATES: ContractCandidate[] = []

type ContractState = {
  id: string
  status: string
  title: string
  description: string
  totalAmount: number
  depositAmount: number
  depositPaid: boolean
  materials: any[]
  phases: any[]
  createdAt?: string | null
  acceptedAt?: string | null
}

type BookingModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void

  currentUser: UserDTO | null | undefined

  participant: {
    id: string
    name: string
    email?: string
  } | null

  /**
   * Contract IDs extracted from contract messages in the
   * currently selected messaging conversation.
   */
  contractCandidates?: ContractCandidate[]

  /**
   * Passed by the employer or artisan booking page when
   * editing an existing booking.
   */
  initialBooking?: BookingDTO | null

  onSaved?: (booking: BookingDTO) => void
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const timezoneOffset =
    date.getTimezoneOffset() * 60_000

  return new Date(
    date.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 16)
}

function normalizeContractStatus(
  value?: string | null
) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
}

function isAcceptedContract(
  status?: string | null
) {
  const normalized =
    normalizeContractStatus(status)

  return (
    normalized === "accepted" ||
    normalized === "active"
  )
}

function normalizeContractState(
  response: any
): ContractState | null {
  const contract =
    response?.contract ??
    response?.data?.contract ??
    response?.data ??
    response

  if (!contract?.id) {
    return null
  }

  return {
    id: String(contract.id),
    status: String(contract.status || ""),
    title: String(
      contract.title || "Contract"
    ),
    description: String(
      contract.description || ""
    ),
    totalAmount: Number(
      contract.totalAmount || 0
    ),
    depositAmount: Number(
      contract.depositAmount || 0
    ),
    depositPaid: Boolean(
      contract.depositPaid
    ),
    materials: Array.isArray(
      contract.materials
    )
      ? contract.materials
      : [],
    phases: Array.isArray(contract.phases)
      ? contract.phases
      : [],
    createdAt: contract.createdAt || null,
    acceptedAt: contract.acceptedAt || null,
  }
}

function deduplicateContractCandidates(
  candidates: ContractCandidate[]
) {
  const unique =
    new Map<string, ContractCandidate>()

  for (const candidate of candidates) {
    const id = String(
      candidate?.id || ""
    ).trim()

    if (!id || unique.has(id)) {
      continue
    }

    unique.set(id, {
      ...candidate,
      id,
    })
  }

  return Array.from(unique.values())
}

export function BookingModal({
  open,
  onOpenChange,
  currentUser,
  participant,
  contractCandidates =
    EMPTY_CONTRACT_CANDIDATES,
  initialBooking = null,
  onSaved,
}: BookingModalProps) {
  const isEmployer =
    currentUser?.role === "employer"

  const isArtisan =
    currentUser?.role === "artisan"

  /**
   * This string changes only when the actual contract IDs
   * change. It prevents effects from rerunning because a
   * parent component created a new array reference.
   */
  const contractCandidateKey = useMemo(
    () =>
      contractCandidates
        .map((candidate) =>
          String(candidate.id)
        )
        .filter(Boolean)
        .sort()
        .join("|"),
    [contractCandidates]
  )

  const stableContractCandidates =
    useMemo(
      () =>
        deduplicateContractCandidates(
          contractCandidates
        ),
      // The key represents the actual candidate IDs.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [contractCandidateKey]
    )

  const [bookings, setBookings] = useState<
    BookingDTO[]
  >([])

  const [
    acceptedContracts,
    setAcceptedContracts,
  ] = useState<ContractState[]>([])

  const [
    selectedBookingId,
    setSelectedBookingId,
  ] = useState("")

  const [
    selectedContractId,
    setSelectedContractId,
  ] = useState("")

  const [scheduledAt, setScheduledAt] =
    useState("")

  const [employerNote, setEmployerNote] =
    useState("")

  const [artisanNote, setArtisanNote] =
    useState("")

  const [location, setLocation] =
    useState("")

  const [duration, setDuration] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  const [
    contractsLoading,
    setContractsLoading,
  ] = useState(false)

  const [saving, setSaving] =
    useState(false)

  const selectedBooking = useMemo(() => {
    if (initialBooking) {
      return initialBooking
    }

    return (
      bookings.find(
        (booking) =>
          booking.id === selectedBookingId
      ) || null
    )
  }, [
    bookings,
    initialBooking,
    selectedBookingId,
  ])

  const selectedContract = useMemo(
    () =>
      acceptedContracts.find(
        (contract) =>
          String(contract.id) ===
          String(selectedContractId)
      ) || null,
    [
      acceptedContracts,
      selectedContractId,
    ]
  )

  const editing = Boolean(selectedBooking)

  /**
   * Load scheduled bookings between the logged-in user and
   * the selected participant.
   */
  useEffect(() => {
    if (!open || !participant?.id) {
      return
    }

    let cancelled = false

    async function loadBookings() {
      try {
        setLoading(true)

        const response =
          await listBookingsWithParticipant(
            participant!.id
          )

        if (cancelled) {
          return
        }

        const scheduledBookings = (
          Array.isArray(response)
            ? response
            : []
        ).filter(
          (booking) =>
            booking.status === "scheduled"
        )

        setBookings(scheduledBookings)

        if (initialBooking) {
          setSelectedBookingId(
            initialBooking.id
          )
        } else if (
          scheduledBookings.length > 0
        ) {
          setSelectedBookingId(
            scheduledBookings[0].id
          )
        } else {
          setSelectedBookingId("")
        }
      } catch (error: any) {
        console.error(
          "[BookingModal] Failed to load bookings:",
          error
        )

        if (!cancelled) {
          setBookings([])

          toast.error(
            error?.message ||
              "Unable to load booking information"
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadBookings()

    return () => {
      cancelled = true
    }
  }, [
    open,
    participant?.id,
    initialBooking?.id,
  ])

  /**
   * Load contract states only when creating a booking from
   * the messaging interface.
   *
   * Editing an existing booking does not need contract
   * discovery. Returning without setting state prevents the
   * Maximum update depth loop.
   */
  useEffect(() => {
    if (!open) {
      return
    }

    if (editing || !isEmployer) {
      return
    }

    if (
      stableContractCandidates.length === 0
    ) {
      setAcceptedContracts((previous) =>
        previous.length === 0
          ? previous
          : []
      )

      setSelectedContractId((previous) =>
        previous === "" ? previous : ""
      )

      setContractsLoading(false)
      return
    }

    let cancelled = false

    async function loadAcceptedContracts() {
      try {
        setContractsLoading(true)

        const results =
          await Promise.allSettled(
            stableContractCandidates.map(
              async (candidate) => {
                const response =
                  await getContractState(
                    String(candidate.id)
                  )

                const contract =
                  normalizeContractState(
                    response
                  )

                if (!contract) {
                  return null
                }

                if (
                  !isAcceptedContract(
                    contract.status
                  )
                ) {
                  return null
                }

                return {
                  ...contract,
                  title:
                    contract.title ||
                    candidate.title ||
                    "Contract",
                }
              }
            )
          )

        if (cancelled) {
          return
        }

        const accepted = results
          .filter(
            (
              result
            ): result is PromiseFulfilledResult<
              ContractState | null
            > =>
              result.status === "fulfilled"
          )
          .map((result) => result.value)
          .filter(
            (
              contract
            ): contract is ContractState =>
              Boolean(contract)
          )

        setAcceptedContracts(accepted)

        setSelectedContractId(
          (current) => {
            if (
              current &&
              accepted.some(
                (contract) =>
                  String(contract.id) ===
                  String(current)
              )
            ) {
              return current
            }

            if (accepted.length === 1) {
              return accepted[0].id
            }

            return ""
          }
        )

        const failedCount =
          results.filter(
            (result) =>
              result.status === "rejected"
          ).length

        if (failedCount > 0) {
          console.warn(
            `[BookingModal] ${failedCount} contract state request(s) failed`
          )
        }
      } catch (error: any) {
        console.error(
          "[BookingModal] Failed to load contract states:",
          error
        )

        if (!cancelled) {
          setAcceptedContracts([])
          setSelectedContractId("")

          toast.error(
            error?.message ||
              "Unable to load accepted contracts"
          )
        }
      } finally {
        if (!cancelled) {
          setContractsLoading(false)
        }
      }
    }

    loadAcceptedContracts()

    return () => {
      cancelled = true
    }
  }, [
    open,
    isEmployer,
    editing,
    contractCandidateKey,
  ])

  /**
   * Populate the editable form.
   *
   * Scalar dependencies prevent the effect from rerunning
   * simply because the parent recreated the booking object.
   */
  useEffect(() => {
    if (!open) {
      return
    }

    if (!selectedBooking) {
      setScheduledAt((previous) =>
        previous === "" ? previous : ""
      )

      setEmployerNote((previous) =>
        previous === "" ? previous : ""
      )

      setArtisanNote((previous) =>
        previous === "" ? previous : ""
      )

      setLocation((previous) =>
        previous === "" ? previous : ""
      )

      setDuration((previous) =>
        previous === "" ? previous : ""
      )

      return
    }

    const nextScheduledAt =
      toDateTimeLocal(
        selectedBooking.scheduled_at
      )

    const nextEmployerNote =
      selectedBooking.details
        ?.employerNote || ""

    const nextArtisanNote =
      selectedBooking.details
        ?.artisanNote || ""

    const nextLocation =
      selectedBooking.details?.location || ""

    const nextDuration =
      selectedBooking.details?.duration || ""

    setScheduledAt((previous) =>
      previous === nextScheduledAt
        ? previous
        : nextScheduledAt
    )

    setEmployerNote((previous) =>
      previous === nextEmployerNote
        ? previous
        : nextEmployerNote
    )

    setArtisanNote((previous) =>
      previous === nextArtisanNote
        ? previous
        : nextArtisanNote
    )

    setLocation((previous) =>
      previous === nextLocation
        ? previous
        : nextLocation
    )

    setDuration((previous) =>
      previous === nextDuration
        ? previous
        : nextDuration
    )
  }, [
    open,
    selectedBooking?.id,
    selectedBooking?.scheduled_at,
    selectedBooking?.details?.employerNote,
    selectedBooking?.details?.artisanNote,
    selectedBooking?.details?.location,
    selectedBooking?.details?.duration,
  ])

  /**
   * Clear stale data once the modal closes.
   */
  useEffect(() => {
    if (open) {
      return
    }

    setBookings([])
    setAcceptedContracts([])
    setSelectedBookingId("")
    setSelectedContractId("")
    setScheduledAt("")
    setEmployerNote("")
    setArtisanNote("")
    setLocation("")
    setDuration("")
    setLoading(false)
    setContractsLoading(false)
    setSaving(false)
  }, [open])

  const resetForCreate = () => {
    setSelectedBookingId("")

    setSelectedContractId(
      acceptedContracts.length === 1
        ? acceptedContracts[0].id
        : ""
    )

    setScheduledAt("")
    setEmployerNote("")
    setArtisanNote("")
    setLocation("")
    setDuration("")
  }

  const handleSave = async () => {
    if (!participant?.id) {
      toast.error(
        "No conversation participant selected"
      )
      return
    }

    if (!scheduledAt) {
      toast.error(
        "Select a booking date and time"
      )
      return
    }

    const selectedDate =
      new Date(scheduledAt)

    if (
      Number.isNaN(
        selectedDate.getTime()
      ) ||
      selectedDate.getTime() <=
        Date.now()
    ) {
      toast.error(
        "Booking date and time must be in the future"
      )
      return
    }

    try {
      setSaving(true)

      let savedBooking: BookingDTO

      if (editing && selectedBooking) {
        savedBooking =
          await modifyBooking(
            selectedBooking.id,
            isEmployer
              ? {
                  scheduledAt:
                    selectedDate.toISOString(),
                  employerNote,
                  location,
                  duration,
                }
              : {
                  scheduledAt:
                    selectedDate.toISOString(),
                  artisanNote,
                }
          )
      } else {
        if (!isEmployer) {
          toast.error(
            "Only employers can create bookings"
          )
          return
        }

        if (!selectedContractId) {
          toast.error(
            "Select an accepted contract"
          )
          return
        }

        /**
         * Confirm the latest contract status immediately
         * before creating the booking.
         */
        const stateResponse =
          await getContractState(
            selectedContractId
          )

        const latestContract =
          normalizeContractState(
            stateResponse
          )

        if (!latestContract) {
          toast.error(
            "The selected contract could not be loaded"
          )
          return
        }

        if (
          !isAcceptedContract(
            latestContract.status
          )
        ) {
          setAcceptedContracts(
            (previous) =>
              previous.filter(
                (contract) =>
                  String(contract.id) !==
                  String(
                    selectedContractId
                  )
              )
          )

          setSelectedContractId("")

          toast.error(
            "The selected contract is no longer accepted"
          )
          return
        }

        savedBooking =
          await createBooking({
            contractId:
              latestContract.id,
            artisanId:
              participant.id,
            scheduledAt:
              selectedDate.toISOString(),
            details: {
              employerNote,
              location,
              duration,
            },
          })
      }

      toast.success(
        editing
          ? "Booking updated successfully"
          : "Booking created successfully"
      )

      onSaved?.(savedBooking)
      onOpenChange(false)
    } catch (error: any) {
      console.error(
        "[BookingModal] Failed to save booking:",
        error
      )

      toast.error(
        error?.message ||
          "Unable to save booking"
      )
    } finally {
      setSaving(false)
    }
  }

  const modalTitle = editing
    ? "Edit booking"
    : isEmployer
      ? "Create booking"
      : "Booking details"

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] w-[calc(100%-24px)] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>

          <DialogTitle className="pt-3 text-xl">
            {modalTitle}
          </DialogTitle>

          <DialogDescription>
            {isEmployer
              ? `Schedule work with ${
                  participant?.name ||
                  "this artisan"
                }.`
              : `View or update your schedule with ${
                  participant?.name ||
                  "this employer"
                }.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-5 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                <div className="h-10 w-full animate-pulse rounded-md bg-slate-100" />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <div className="h-10 w-24 animate-pulse rounded-md bg-slate-100" />
              <div className="h-10 w-24 animate-pulse rounded-md bg-slate-100" />
            </div>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {bookings.length > 0 &&
              !initialBooking && (
                <div className="space-y-2">
                  <Label>
                    Existing booking
                  </Label>

                  <select
                    value={selectedBookingId}
                    onChange={(event) =>
                      setSelectedBookingId(
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    {isEmployer && (
                      <option value="">
                        Create a new booking
                      </option>
                    )}

                    {bookings.map(
                      (booking) => (
                        <option
                          key={booking.id}
                          value={booking.id}
                        >
                          {booking.job
                            ?.title ||
                            booking.Job
                              ?.title ||
                            "Booking"}{" "}
                          —{" "}
                          {new Date(
                            booking.scheduled_at
                          ).toLocaleString()}
                        </option>
                      )
                    )}
                  </select>

                  {isEmployer &&
                    selectedBookingId && (
                      <button
                        type="button"
                        onClick={
                          resetForCreate
                        }
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Create another
                        booking
                      </button>
                    )}
                </div>
              )}

            {!editing && isEmployer && (
              <div className="space-y-2">
                <Label htmlFor="acceptedContract">
                  Accepted contract{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </Label>

                {contractsLoading ? (
                  <div className="flex h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking current contract
                    statuses...
                  </div>
                ) : (
                  <select
                    id="acceptedContract"
                    value={
                      selectedContractId
                    }
                    onChange={(event) =>
                      setSelectedContractId(
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">
                      Select an accepted
                      contract
                    </option>

                    {acceptedContracts.map(
                      (contract) => (
                        <option
                          key={contract.id}
                          value={contract.id}
                        >
                          {contract.title}
                        </option>
                      )
                    )}
                  </select>
                )}

                {!contractsLoading &&
                  stableContractCandidates.length ===
                    0 && (
                    <p className="text-xs leading-5 text-amber-600">
                      No contract was found
                      in this conversation.
                      A contract must be sent
                      and accepted before
                      creating a booking.
                    </p>
                  )}

                {!contractsLoading &&
                  stableContractCandidates.length >
                    0 &&
                  acceptedContracts.length ===
                    0 && (
                    <p className="text-xs leading-5 text-amber-600">
                      This conversation has
                      no currently accepted
                      contract. Pending,
                      declined or cancelled
                      contracts cannot be
                      booked.
                    </p>
                  )}

                {selectedContract && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {
                            selectedContract.title
                          }
                        </p>

                        {selectedContract.description && (
                          <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">
                            {
                              selectedContract.description
                            }
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                          <span>
                            Status:{" "}
                            <strong className="capitalize text-emerald-600">
                              {normalizeContractStatus(
                                selectedContract.status
                              ).replace(
                                /_/g,
                                " "
                              )}
                            </strong>
                          </span>

                          <span>
                            Total:{" "}
                            <strong>
                              ₦
                              {selectedContract.totalAmount.toLocaleString()}
                            </strong>
                          </span>

                          <span>
                            Milestones:{" "}
                            <strong>
                              {
                                selectedContract
                                  .phases
                                  .length
                              }
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isArtisan &&
              !editing &&
              bookings.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                  <p className="text-sm font-medium text-slate-800">
                    No scheduled booking
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Only the employer can
                    create a booking. Once
                    created, you can suggest
                    a new time and leave a
                    message here.
                  </p>
                </div>
              )}

            {(editing || isEmployer) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bookingDate">
                    Date and time{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </Label>

                  <div className="relative">
                    <Clock3 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      id="bookingDate"
                      type="datetime-local"
                      min={toDateTimeLocal(
                        new Date(
                          Date.now() +
                            5 *
                              60 *
                              1000
                        ).toISOString()
                      )}
                      value={scheduledAt}
                      onChange={(event) =>
                        setScheduledAt(
                          event.target.value
                        )
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                {isEmployer && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bookingLocation">
                        Location
                      </Label>

                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                        <Input
                          id="bookingLocation"
                          value={location}
                          onChange={(event) =>
                            setLocation(
                              event.target
                                .value
                            )
                          }
                          placeholder="Enter work location"
                          className="pl-10"
                          maxLength={255}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bookingDuration">
                        Estimated duration
                      </Label>

                      <Input
                        id="bookingDuration"
                        value={duration}
                        onChange={(event) =>
                          setDuration(
                            event.target
                              .value
                          )
                        }
                        placeholder="Example: 2 hours or 3 days"
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employerNote">
                        Message to artisan
                      </Label>

                      <Textarea
                        id="employerNote"
                        value={employerNote}
                        onChange={(event) =>
                          setEmployerNote(
                            event.target
                              .value
                          )
                        }
                        placeholder="Add instructions or information about the booking"
                        rows={4}
                        maxLength={2000}
                      />
                    </div>
                  </>
                )}

                {isArtisan && editing && (
                  <div className="space-y-2">
                    <Label htmlFor="artisanNote">
                      Message to employer
                    </Label>

                    <div className="relative">
                      <NotebookPen className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                      <Textarea
                        id="artisanNote"
                        value={artisanNote}
                        onChange={(event) =>
                          setArtisanNote(
                            event.target
                              .value
                          )
                        }
                        placeholder="Add a note or suggest a suitable arrangement"
                        rows={4}
                        maxLength={2000}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                {editing && (
                  <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                    <p>
                      <strong>
                        Employer note:
                      </strong>{" "}
                      {employerNote ||
                        "No note provided"}
                    </p>

                    <p className="mt-2">
                      <strong>
                        Artisan note:
                      </strong>{" "}
                      {artisanNote ||
                        "No note provided"}
                    </p>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      onOpenChange(false)
                    }
                    disabled={saving}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={
                      saving ||
                      contractsLoading ||
                      (!editing &&
                        isEmployer &&
                        !selectedContractId) ||
                      (isArtisan &&
                        !editing)
                    }
                  >
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}

                    {saving
                      ? "Saving..."
                      : editing
                        ? "Save changes"
                        : "Create booking"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}