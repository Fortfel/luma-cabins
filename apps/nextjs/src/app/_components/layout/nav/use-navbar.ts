'use client'

import * as React from 'react'

import { NavbarContext } from '~/app/_components/layout/nav/navbar-provider'

const useNavbar = () => {
  const context = React.useContext(NavbarContext)
  if (!context) {
    throw new Error('useNavbar must be used within a NavbarProvider.')
  }
  return context
}

export { useNavbar }
