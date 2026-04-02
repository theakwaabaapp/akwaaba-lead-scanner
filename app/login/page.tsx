"use client";

import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      window.location.href = "/";
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-akwaaba-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/akwaaba-logo.png"
            alt="Akwaaba"
            width={64}
            height={64}
            className="rounded-xl mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-gray-800">Lead Scanner</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your team password</p>
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={`w-full px-4 py-3 rounded-xl border-2 text-sm transition-all outline-none ${
              error ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-akwaaba-green"
            }`}
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-xs mt-2">Wrong password. Try again.</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full mt-4 px-4 py-3 rounded-xl bg-akwaaba-green text-white font-semibold hover:bg-akwaaba-green-light transition-all disabled:opacity-50"
          >
            {loading ? "Checking..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
