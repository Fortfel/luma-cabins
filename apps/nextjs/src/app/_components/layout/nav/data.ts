import { aboutLinkOptions } from '~/app/(app)/_validations/app-link-options'

interface NavigationLink {
  className: string
  label: string
  linkOptions: { href: string }
}

const navigationDesktopLinks = [
  { className: '', label: 'Models', linkOptions: { href: '#models' } },
  { className: '', label: 'How it works', linkOptions: { href: '#process' } },
  { className: '', label: 'Portfolio', linkOptions: aboutLinkOptions() },
  { className: '', label: 'FAQ', linkOptions: { href: '#faqs' } },
] as const satisfies ReadonlyArray<NavigationLink>

const navigationMobileLinks = [
  ...navigationDesktopLinks,
  { className: '', label: 'Contact', linkOptions: { href: '/contact' } },
] as const satisfies ReadonlyArray<NavigationLink>

export { navigationDesktopLinks, navigationMobileLinks }
