import React from "react"

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="container flex min-h-screen items-center justify-center py-16">
      {children}
    </div>
  )
}
