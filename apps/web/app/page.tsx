export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
      <h1 className="text-4xl font-bold">Satisfactory Planner</h1>
      <p className="text-gray-400 max-w-md text-center">
        Plan and optimize your Satisfactory factories. Design production lines,
        balance power, and compare alternate recipes.
      </p>
      <div className="flex gap-4 mt-4">
        <a
          href="/planner"
          className="rounded bg-blue-600 px-6 py-2 text-sm font-medium hover:bg-blue-500"
        >
          Open Planner
        </a>
        <a
          href="/calculator"
          className="rounded bg-gray-700 px-6 py-2 text-sm font-medium hover:bg-gray-600"
        >
          Calculator
        </a>
      </div>
    </div>
  );
}