import TopBar from './TopBar'
import SideDrawer from './SideDrawer'
import { useState } from 'react'

export default function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="site-shell">
      <TopBar onMenuClick={() => setDrawerOpen(true)} />
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main>{children}</main>
    </div>
  )
}