"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  MapPin, 
  Radio, 
  Activity, 
  Users, 
  Wind, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Filter, 
  RefreshCw,
  ExternalLink,
  Plane
} from "lucide-react";
import HimalayanMap, { MapMarkerItem } from "@/components/map/HimalayanMap";

export default function RescueDashboardPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sos${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`);
      const data = await res.json();
      if (data.success && data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 6000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  // Map markers: victim incidents + rescue nodes
  const mapMarkers: MapMarkerItem[] = [
    {
      id: "namche-army-post",
      lat: 27.8069,
      lng: 86.7140,
      title: "Namche Army Rescue Liaison Post",
      subtitle: "Helicopter Pad & Satellite Comms",
      type: "rescue_hq",
      altitude: 3440,
    },
    {
      id: "pheriche-hra-clinic",
      lat: 27.8925,
      lng: 86.8200,
      title: "Pheriche HRA Altitude Medical Clinic",
      subtitle: "Hyperbaric Chamber (Gamow) & Oxygen Hub",
      type: "lodge",
      altitude: 4280,
    },
  ];

  alerts.forEach((alert) => {
    mapMarkers.push({
      id: alert.id,
      lat: alert.lat,
      lng: alert.lng,
      title: `${alert.victim?.name || "Victim"} (${alert.status})`,
      subtitle: alert.locationName,
      type: alert.status === "resolved" ? "responder" : "victim",
      altitude: alert.altitude || 4500,
      status: alert.status,
    });
  });

  const activeCount = alerts.filter((a) => a.status === "active" || a.status === "responding").length;
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length;
  const offGridRelayedCount = alerts.filter((a) => a.isOfflineQueued).length;

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Himalayan Search & Rescue Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Namche Army Mountain Liaison & Himalayan Rescue Association (HRA) Tactical Feed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {(["all", "active", "responding", "resolved"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                  statusFilter === filter
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800"
            title="Refresh tactical data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-red-900/40 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] uppercase font-bold text-red-400 block tracking-wider">
            Active Incidents
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-3xl font-black text-white">{activeCount}</span>
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-900/40 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] uppercase font-bold text-emerald-400 block tracking-wider">
            Safely Resolved
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-3xl font-black text-white">{resolvedCount}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-blue-900/40 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] uppercase font-bold text-blue-400 block tracking-wider">
            Off-Grid BLE Relayed
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-3xl font-black text-white">{offGridRelayedCount}</span>
            <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
        </div>

        {/* Helicopter Evac Weather Readiness Tile */}
        <div className="bg-slate-900/90 border border-amber-900/40 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] uppercase font-bold text-amber-400 block tracking-wider flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5" />
            Heli Evac Status
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-bold text-emerald-400">OPEN WINDOW</span>
            <span className="text-[10px] text-slate-400 font-mono">Ceiling &gt; 5,800m</span>
          </div>
        </div>
      </div>

      {/* Main Tactical Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>Khumbu Valley Regional Tactical Map</span>
          <span className="text-blue-400">● 4G Gateway Uplink Active @ Namche</span>
        </div>

        <HimalayanMap
          center={[27.8920, 86.8315]}
          zoom={11}
          markers={mapMarkers}
          className="w-full h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
        />
      </div>

      {/* Incidents Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm uppercase font-extrabold tracking-wider text-slate-200">
          Emergency Incident Manifest
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Victim</th>
                <th className="py-3 px-3">Location & Altitude</th>
                <th className="py-3 px-3">Condition</th>
                <th className="py-3 px-3">Delivery Protocol</th>
                <th className="py-3 px-3">Responders</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-white block">{alert.victim?.name}</span>
                    <span className="text-[10px] text-slate-400">{alert.victim?.phone}</span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="block text-slate-200">{alert.locationName}</span>
                    <span className="text-[10px] text-slate-400">{alert.altitude ? `🏔️ ${alert.altitude}m` : ""}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-950 text-red-300 border border-red-800">
                      {alert.injuryType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]">
                    {alert.isOfflineQueued ? (
                      <span className="text-blue-400 font-bold">Mesh Relayed ({alert.hopCount} Hops)</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Direct Cloud</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-200">
                      {alert.responses?.length || 0} local guides
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        alert.status === "active"
                          ? "bg-red-900 text-red-200 animate-pulse"
                          : alert.status === "responding"
                          ? "bg-amber-900 text-amber-200"
                          : "bg-emerald-900 text-emerald-200"
                      }`}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/alerts/${alert.id}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 transition-all"
                    >
                      <span>Dossier</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
