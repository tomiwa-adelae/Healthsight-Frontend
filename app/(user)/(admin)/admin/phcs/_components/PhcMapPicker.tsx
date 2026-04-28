"use client"

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix leaflet default icon broken by webpack/bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onPick(parseFloat(e.latlng.lat.toFixed(7)), parseFloat(e.latlng.lng.toFixed(7)))
    },
  })
  return null
}

type Props = {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}

export default function PhcMapPicker({ lat, lng, onChange }: Props) {
  const hasPin = lat != null && lng != null
  const center: [number, number] = hasPin ? [lat!, lng!] : [6.524, 3.38]

  return (
    <MapContainer
      key={`${lat}-${lng}-init`}
      center={center}
      zoom={hasPin ? 15 : 11}
      className="h-52 w-full rounded-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onChange} />
      {hasPin && <Marker position={[lat!, lng!]} />}
    </MapContainer>
  )
}
