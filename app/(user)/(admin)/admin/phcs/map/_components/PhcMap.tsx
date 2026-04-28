"use client"

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect } from "react"

// Fix leaflet default marker icon broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

type Phc = {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  lga: { name: string; district: { name: string } }
}

function FitBounds({ phcs }: { phcs: Phc[] }) {
  const map = useMap()
  useEffect(() => {
    const withCoords = phcs.filter((p) => p.latitude && p.longitude)
    if (withCoords.length === 0) return
    const bounds = L.latLngBounds(
      withCoords.map((p) => [p.latitude!, p.longitude!])
    )
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [phcs, map])
  return null
}

export default function PhcMap({ phcs }: { phcs: Phc[] }) {
  const withCoords = phcs.filter((p) => p.latitude && p.longitude)

  return (
    <MapContainer
      center={[6.524, 3.38]}
      zoom={11}
      className="h-full w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds phcs={withCoords} />
      {withCoords.map((phc) => (
        <Marker key={phc.id} position={[phc.latitude!, phc.longitude!]}>
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{phc.name}</p>
              {phc.address && (
                <p className="text-xs text-gray-500">{phc.address}</p>
              )}
              <p className="text-xs text-gray-500">
                {phc.lga.name} · {phc.lga.district.name}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
