import { aboutLinkOptions, contactLinkOptions } from '~/app/(app)/_validations/app-link-options'

interface NavigationLink {
  className: string
  label: string
  linkOptions: { href: string }
}

const navigationDesktopLinks = [
  { className: '', label: 'About', linkOptions: aboutLinkOptions() },
  { className: '', label: 'Contact', linkOptions: contactLinkOptions() },
] as const satisfies ReadonlyArray<NavigationLink>

const navigationMobileLinks = [...navigationDesktopLinks] as const satisfies ReadonlyArray<NavigationLink>

export { navigationDesktopLinks, navigationMobileLinks }
