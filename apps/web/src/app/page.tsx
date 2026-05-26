export default function Home() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-amber-400 mb-4">Satisfactory Planner</h1>
      <p className="text-gray-400 mb-6">
        Plan and optimize your factory production lines. Calculate resource requirements,
        compare alternate recipes, and visualize your production tree.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <a
          href="/calculator"
          className="block p-6 bg-gray-900 rounded-lg border border-gray-800 hover:border-amber-500/50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-amber-400 mb-2">Calculator</h2>
          <p className="text-gray-400 text-sm">
            Solve production chains, find optimal recipes, and visualize your factory tree.
          </p>
        </a>
        <a
          href="/planner"
          className="block p-6 bg-gray-900 rounded-lg border border-gray-800 hover:border-amber-500/50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-amber-400 mb-2">Planner</h2>
          <p className="text-gray-400 text-sm">
            Design your factory layout with a visual canvas, place buildings, and connect them.
          </p>
        </a>
      </div>
    </div>
  );
}