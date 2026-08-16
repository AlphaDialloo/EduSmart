export default function UploadProgress({
  progress
}) {
  return <div className="mt-4">
      <div className="flex justify-between text-sm font-semibold text-slate-600">
        <span>Téléversement...</span>
        <span>{progress}%</span>
      </div>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-600 transition-all duration-300" style={{
        width: `${progress}%`
      }} />
      </div>
    </div>;
}
