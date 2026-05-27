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
    { label: "AI Reviews", href: "/review" },
    { label: "Security", href: "#" },
    { label: "Deployments", href: "#" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PRism AI</h1>
          <p className="text-zinc-400 text-sm">
            AI GitHub Engineering Platform
          </p>
        </div>

        {session ? (
          <div className="flex items-center gap-4">
            <img
              src={session.user?.image ?? ""}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />

            <span className="text-sm text-zinc-300">
              {session.user?.name}
            </span>

            <button
              onClick={() => signOut()}
              className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2 rounded-xl text-sm"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("github")}
            className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:opacity-90 transition"
          >
            Connect GitHub
          </button>
        )}
      </header>

      <div className="grid grid-cols-12">
        {/* Sidebar */}
        <aside className="col-span-2 border-r border-zinc-800 min-h-screen p-5">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
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

        {/* Main Content */}
        <section className="col-span-10 p-8 max-w-3xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Settings</h2>

            <p className="text-zinc-400 mt-1 text-sm">
              Manage your PRism AI configuration
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-5">Profile</h3>

              {session ? (
                <div className="flex items-center gap-4">
                  <img
                    src={session.user?.image ?? ""}
                    alt="avatar"
                    className="w-14 h-14 rounded-full border border-zinc-700"
                  />

                  <div>
                    <p className="font-semibold">{session.user?.name}</p>

                    <p className="text-zinc-400 text-sm">
                      {session.user?.email}
                    </p>

                    <p className="text-zinc-500 text-xs mt-1">
                      Connected via GitHub
                    </p>
                  </div>

                  <button
                    onClick={() => signOut()}
                    className="ml-auto bg-red-950 border border-red-800 text-red-400 px-4 py-2 rounded-xl text-sm hover:bg-red-900 transition"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-zinc-400 text-sm">Not connected</p>

                  <button
                    onClick={() => signIn("github")}
                    className="bg-white text-black px-4 py-2 rounded-xl text-sm font-medium"
                  >
                    Connect GitHub
                  </button>
                </div>
              )}
            </div>

            {/* AI Model */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-1">AI Model</h3>

              <p className="text-zinc-500 text-sm mb-5">
                Choose which model powers your code reviews
              </p>

              <div className="space-y-3">
                {[
                  {
                    id: "kimi-k2",
                    name: "Kimi-K2",
                    desc: "HuggingFace — Free tier, fast",
                    badge: "Active",
                  },
                  {
                    id: "gpt4o",
                    name: "GPT-4o",
                    desc: "OpenAI — Best quality, requires billing",
                    badge: "Paid",
                  },
                  {
                    id: "claude",
                    name: "Claude Sonnet",
                    desc: "Anthropic — Great for code review",
                    badge: "Paid",
                  },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition ${
                      model === m.id
                        ? "border-white bg-zinc-800"
                        : "border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{m.name}</p>

                      <p className="text-zinc-500 text-xs mt-0.5">
                        {m.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          m.badge === "Active"
                            ? "text-green-400 border-green-800 bg-green-950"
                            : "text-zinc-500 border-zinc-700"
                        }`}
                      >
                        {m.badge}
                      </span>

                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          model === m.id
                            ? "border-white bg-white"
                            : "border-zinc-600"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Settings */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-1">
                Review Settings
              </h3>

              <p className="text-zinc-500 text-sm mb-5">
                Configure how AI reviews behave
              </p>

              <div className="space-y-5">
                {/* Auto Review */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Auto-review on PR open
                    </p>

                    <p className="text-zinc-500 text-xs mt-0.5">
                      Automatically trigger AI review when a PR is opened
                    </p>
                  </div>

                  <button
                    onClick={() => setAutoReview(!autoReview)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      autoReview ? "bg-white" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
                        autoReview
                          ? "translate-x-5 bg-black"
                          : "translate-x-0 bg-zinc-400"
                      }`}
                    />
                  </button>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Review notifications
                    </p>

                    <p className="text-zinc-500 text-xs mt-0.5">
                      Get notified when AI review completes
                    </p>
                  </div>

                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      notifications ? "bg-white" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
                        notifications
                          ? "translate-x-5 bg-black"
                          : "translate-x-0 bg-zinc-400"
                      }`}
                    />
                  </button>
                </div>

                {/* Risk Threshold */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">
                        Risk alert threshold
                      </p>

                      <p className="text-zinc-500 text-xs mt-0.5">
                        Alert when risk score exceeds this value
                      </p>
                    </div>

                    <span className="text-white font-bold">
                      {riskThreshold}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={riskThreshold}
                    onChange={(e) => setRiskThreshold(e.target.value)}
                    className="w-full accent-white"
                  />

                  <div className="flex justify-between text-xs text-zinc-600 mt-1">
                    <span>0 — All alerts</span>
                    <span>100 — No alerts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* API Keys */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-1">API Keys</h3>

              <p className="text-zinc-500 text-sm mb-5">
                Configured in your .env.local file
              </p>

              <div className="space-y-3">
                {[
                  {
                    label: "HuggingFace Token",
                    key: "HF_TOKEN",
                    status: true,
                  },
                  {
                    label: "OpenAI API Key",
                    key: "OPENAI_API_KEY",
                    status: false,
                  },
                  {
                    label: "GitHub OAuth",
                    key: "GITHUB_ID + GITHUB_SECRET",
                    status: true,
                  },
                ].map((k) => (
                  <div
                    key={k.key}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{k.label}</p>

                      <p className="text-zinc-600 text-xs font-mono mt-0.5">
                        {k.key}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${
                        k.status
                          ? "text-green-400 border-green-800 bg-green-950"
                          : "text-zinc-500 border-zinc-700 bg-zinc-900"
                      }`}
                    >
                      {k.status ? "Configured" : "Not set"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4 pb-8">
              <button
                onClick={handleSave}
                className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
              >
                Save Settings
              </button>

              {saved && (
                <span className="text-green-400 text-sm">
                  Settings saved successfully
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}