import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-accent text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-black">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logomark.svg" alt="Brikcell Logo" className="h-8 w-7" />
              <span className="text-2xl font-semibold">Brikcell</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Connecting customers with trusted local artisans for quality services. Your perfect artisan awaits!
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-6 w-6 text-gray-300 hover:text-white cursor-pointer" />
              <Twitter className="h-6 w-6 text-gray-300 hover:text-white cursor-pointer" />
              <Instagram className="h-6 w-6 text-gray-300 hover:text-white cursor-pointer" />
              <Linkedin className="h-6 w-6 text-gray-300 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/services/plumbing" className="hover:text-white">
                  Plumbing
                </Link>
              </li>
              <li>
                <Link href="/services/carpentry" className="hover:text-white">
                  Carpentry
                </Link>
              </li>
              <li>
                <Link href="/services/hair-styling" className="hover:text-white">
                  Hair Styling
                </Link>
              </li>
              <li>
                <Link href="/services/electrical" className="hover:text-white">
                  Electrical
                </Link>
              </li>
              <li>
                <Link href="/services/painting" className="hover:text-white">
                  Painting
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/about" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/become-artisan" className="hover:text-white">
                  Become an Artisan
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">© 2024 Brikcell. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-300 hover:text-white text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-300 hover:text-white text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
