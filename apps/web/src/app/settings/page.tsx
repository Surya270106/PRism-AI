"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoReview, setAutoReview] = useState(false);
  const [riskThreshold, setRiskThreshold] = useState("50");
  const [model, setModel] = useState("kimi-k2");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const navItems = [
    { label: "Dashboard", href: "/" },
    { label: "Repositories", href: "/" },
    { label: "Pull Requests", href: "/pr-review" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="grid grid-cols-12">
        <aside className="col-span-2 border-r border-zinc-800 min-h-screen p-5">
          <nav className="space-y-1">
            {navItems.map((item) => (
              
                key={item.label}
                href={item.href}
                className={`block px-4 py-3 rounded-xl transition text-sm ${
                  item.label === "Settings"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <section className="col-span-10 p-8 max-w-3xl">
          <h2 className="text-3xl font-bold mb-8">Settings</h2>
          <div className="flex items-center gap-4 pb-8">
            <button onClick={handleSave} className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition">Save Settings</button>
            {saved && <span className="text-green-400 text-sm">Saved!</span>}
          </div>
        </section>
      </div>
    </main>
  );
}
