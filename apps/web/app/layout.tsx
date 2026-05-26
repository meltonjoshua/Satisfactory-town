import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Satisfactory Planner',
  description: 'Factory planning tool for Satisfactory',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        <nav className="flex items-center gap-6 border-b border-gray-800 px-6 py-3">
          <span className="text-lg font-bold text-gray-100">Satisfactory Planner</span>
          <a href="/" className="text-sm text-gray-400 hover:text-gray-200">Home</a>
          <a href="/planner" className="text-sm text-gray-400 hover:text-gray-200">Planner</a>
          <a href="/calculator" className="text-sm text-gray-400 hover:text-gray-200">Calculator</a>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}