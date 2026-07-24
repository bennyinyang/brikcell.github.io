"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, MessageSquare, MapPin, Star, Loader2, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getFavouriteArtisans, removeFavouriteArtisan } from "@/lib/api"
import { Header } from "@/components/header"

function getInitials(name?: string) {
  return String(name || "")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "A"
}

function Sidebar() {
  const items = [
    { label: "Dashboard", href: "/dashboard/customer" },
    { label: "My Bookings", href: "/dashboard/customer/bookings" },
    { label: "Favourite Artisans", href: "/dashboard/customer/favourites", active: true },
    { label: "Post a Gig", href: "/post-job" },
    { label: "Wallet", href: "/dashboard/customer/wallet" },
    { label: "Settings", href: "/dashboard/customer/settings" },
    { label: "Support", href: "/support" },
  ]

  return (
    <aside className="hidden w-[190px] shrink-0 lg:block">
      <nav className="space-y-4 text-sm">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center rounded-md px-3 py-2 transition ${
              item.active
                ? "bg-slate-50 font-medium text-slate-950"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {item.active && (
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            {!item.active && <span className="mr-3" />}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default function FavouriteArtisansPage() {
  const [favourites, setFavourites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getFavouriteArtisans()
        setFavourites(Array.isArray(data) ? data : [])
      } catch {
        setFavourites([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleRemove(artisanId: string) {
    setRemoving(artisanId)
    try {
      await removeFavouriteArtisan(artisanId)
      setFavourites((prev) => prev.filter((f) => (f.artisan?.id ?? f.artisan_id) !== artisanId))
    } catch {}
    setRemoving(null)
  }

  return (
    <>
      <Header />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 lg:px-8">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-slate-950">Favourite Artisans</h1>
            <p className="mt-1 text-sm text-slate-500">
              Artisans you've saved for quick access
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : favourites.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-950">No saved artisans yet</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Browse talent and tap Save on any artisan profile to add them here.
              </p>
              <Button size="sm" className="mt-5 bg-primary hover:bg-primary/90" asChild>
                <Link href="/search">Browse talent</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favourites.map((fav) => {
                const artisan = fav.artisan ?? {}
                const artisanProfile = artisan.artisanProfile ?? artisan.ArtisanProfile ?? {}
                const artisanId = artisan.id ?? fav.artisan_id
                const name = artisan.name ?? "Artisan"
                const profileImage = artisanProfile?.profile_image ?? artisanProfile?.profileImage
                const location = artisanProfile?.location ?? "—"
                const rating = Number(artisanProfile?.rating) || 0
                const bio = artisanProfile?.bio ?? ""
                const rawSkills = artisanProfile?.skills
                const skills: string[] = Array.isArray(rawSkills)
                  ? rawSkills
                  : typeof rawSkills === "string"
                  ? (() => { try { return JSON.parse(rawSkills) } catch { return rawSkills ? [rawSkills] : [] } })()
                  : []
                const serviceLabel = skills[0] ?? "Professional Artisan"

                return (
                  <div
                    key={fav.id ?? artisanId}
                    className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 border border-slate-100">
                        <AvatarImage src={profileImage} alt={name} />
                        <AvatarFallback className="text-lg font-semibold">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/artisan/${artisanId}`}
                          className="text-sm font-semibold text-slate-950 hover:text-primary"
                        >
                          {name}
                        </Link>
                        <p className="truncate text-xs text-primary">
                          {serviceLabel}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {rating.toFixed(1)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {bio && (
                      <p className="mt-3 line-clamp-2 text-xs text-slate-500">{bio}</p>
                    )}

                    {skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {skills.slice(0, 3).map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="rounded-full px-2 py-0.5 text-[10px]"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-primary text-white hover:bg-primary/90"
                        asChild
                      >
                        <Link
                          href={{
                            pathname: "/messages",
                            query: {
                              artisanId,
                              artisanName: name,
                              artisanEmail: artisan.email ?? "",
                            },
                          }}
                        >
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                          Message
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={removing === artisanId}
                        onClick={() => handleRemove(artisanId)}
                        className="text-slate-500"
                      >
                        {removing === artisanId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
