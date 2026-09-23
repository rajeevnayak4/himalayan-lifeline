"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, User, ShieldAlert, Navigation } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "trekker",
    emergencyContact: "",
    trekRoute: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError("Name and Phone are required.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const role = data.user.role;
        if (role === "trekker") router.push("/sos");
        else if (role === "rescue_coordinator") router.push("/dashboard");
        else router.push("/alerts");

        router.refresh();
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">

        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="mt-6 text-3xl font-extrabold text-white">Join the Network</h2>
          <p className="mt-2 text-sm text-slate-400">Register your device for Jiban Dan</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Full Name
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Pasang Sherpa"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-950 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Phone Number
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+977 9800000000"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-950 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Primary Role
              </label>
              <div className="mt-2">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-slate-700 rounded-xl bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                >
                  <option value="trekker">Trekker / Climber</option>
                  <option value="guide">Local Guide (Sherpa)</option>
                  <option value="lodge_owner">Lodge/Teahouse Owner</option>
                  <option value="rescue_coordinator">Rescue HQ</option>
                </select>
              </div>
            </div>

            {formData.role === "trekker" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Emergency Contact
                  </label>
                  <input
                    name="emergencyContact"
                    type="text"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="Wife/Husband: +1 555-0100"
                    className="mt-2 block w-full px-3 py-3 border border-slate-700 rounded-xl bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Trek Route
                  </label>
                  <div className="mt-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Navigation className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      name="trekRoute"
                      type="text"
                      value={formData.trekRoute}
                      onChange={handleChange}
                      placeholder="e.g. Lukla -> EBC"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-950 text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="text-red-400 text-xs font-bold bg-red-950/50 p-3 rounded-lg border border-red-900">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-black uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "Registering..." : "Create Account"}
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="text-xs text-slate-400">
              Already registered?{" "}
              <Link href="/login" className="text-red-400 hover:text-red-300 font-bold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
