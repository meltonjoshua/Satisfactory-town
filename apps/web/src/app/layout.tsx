import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Satisfactory Planner",
  description: "Plan your Satisfactory factory production lines",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <div className="flex min-h-screen">
          <nav className="w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-1">
            <h1 className="text-lg font-bold text-amber-400 mb-4">Satisfactory Planner</h1>
            <a href="/" className="px-3 py-2 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
              Home
            </a>
            <a href="/calculator" className="px-3 py-2 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
              Calculator
            </a>
            <a href="/planner" className="px-3 py-2 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
              Planner
            </a>
          </nav>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}