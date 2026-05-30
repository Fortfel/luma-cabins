export const homeLinkOptions = ({ withLabel = false }: { withLabel?: boolean } = {}) => ({
  href: '/',
  'aria-label': withLabel ? 'Go to homepage' : undefined,
})

export const aboutLinkOptions = () => ({ href: '/about' })

export const contactLinkOptions = () => ({ href: '/contact' })
