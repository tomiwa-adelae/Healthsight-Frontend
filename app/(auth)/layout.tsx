import React from "react"

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className="container py-16">{children}</div>
}
