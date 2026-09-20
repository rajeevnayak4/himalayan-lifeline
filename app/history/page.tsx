import React from "react";
import { getMockUser } from "@/lib/db/mockUser";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { ShieldAlert, Clock, MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await getMockUser();
  if (!session) redirect("/login");

  let historyItems = [];
  let title = "";

  if (session.role === "trekker") {
    title = "My SOS Beacons";
    const alerts = await prisma.sOSAlert.findMany({
      where: { victimId: session.id },
      orderBy: { createdAt: "desc" },
      include: { responses: true }
    });
    historyItems = alerts.map(a => ({
      id: a.id,
      date: a.createdAt,
      status: a.status,
      location: a.locationName,
      type: "alert",
      details: a.injuryType
    }));
  } else if (session.role === "guide" || session.role === "lodge_owner") {
    title = "My Rescue Responses";
    const responses = await prisma.response.findMany({
      where: { responderId: session.id },
      orderBy: { createdAt: "desc" },
      include: { alert: true }
    });
    historyItems = responses.map(r => ({
      id: r.alertId,
      date: r.createdAt,
      status: r.status,
      location: r.alert.locationName,
      type: "response",
      details: `ETA: ${r.etaMinutes} mins`
    }));
  } else {
    title = "Command Center Operations Logs";
    const allAlerts = await prisma.sOSAlert.findMany({
      where: { status: "resolved" },
      orderBy: { resolvedAt: "desc" },
      take: 50
    });
    historyItems = allAlerts.map(a => ({
      id: a.id,
      date: a.resolvedAt || a.createdAt,
      status: a.status,
      location: a.locationName,
      type: "alert",
      details: a.injuryType
    }));
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Clock className="w-8 h-8 text-purple-400" />
          {title}
        </h1>
        <p className="text-slate-400 text-sm">
          Historical log of your interactions within the Himalayan Lifeline network.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {historyItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No history records found.
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/50">
            {historyItems.map((item, i) => (
              <li key={i} className="p-6 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.status === 'resolved' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <h3 className="text-lg font-bold text-white capitalize">{item.status.replace("_", " ")}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-400 uppercase tracking-wider">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 flex items-center gap-1.5 mt-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      {item.location || "Unknown Coordinates"}
                    </p>
                    <p className="text-xs text-slate-500 font-medium capitalize mt-1">
                      {item.details.replace("_", " ")}
                    </p>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-3">
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(item.date).toLocaleString()}
                    </span>
                    {item.type === "alert" || item.type === "response" ? (
                      <Link 
                        href={`/alerts/${item.id}`}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 bg-purple-950/30 hover:bg-purple-900/40 px-3 py-1.5 rounded-lg border border-purple-900/50 transition-colors"
                      >
                        View Dossier
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
