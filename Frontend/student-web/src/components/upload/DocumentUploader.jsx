import { FileText, LoaderCircle, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { uploadDocument } from "../../services/upload.service";
import UploadProgress from "./UploadProgress";
export default function DocumentUploader({
  value,
  onChange
}) {
  const {
    token
  } = useAuth();
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  async function handleSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const response = await uploadDocument(token, file, setProgress);
      onChange(response.file);
    } catch (error) {
      alert(error.response?.data?.message || "Erreur de téléversement.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }
  return <div className="space-y-5">

      {!value?.url ? <button type="button" onClick={() => inputRef.current.click()} className="flex h-44 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 hover:border-emerald-600">
          <FileText size={45} />

          <span className="mt-3 font-black">
            Ajouter un document
          </span>

          <span className="text-sm text-slate-500">
            PDF • DOCX • ZIP
          </span>

        </button> : <div className="rounded-3xl border bg-white p-6">

          <div className="flex items-center justify-between">

            <div>

              <h4 className="font-black">
                {value.originalName}
              </h4>

              <p className="text-sm text-slate-500">
                {value.mimeType}
              </p>

            </div>

            <button type="button" onClick={() => onChange(null)} className="rounded-xl bg-red-500 p-3 text-white">
              <Trash2 size={18} />
            </button>

          </div>

        </div>}

      <input hidden ref={inputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip" onChange={handleSelect} />

      {uploading && <>
          <UploadProgress progress={progress} />

          <div className="flex items-center gap-3 font-bold text-emerald-600">

            <LoaderCircle className="animate-spin" />

            Téléversement...

          </div>

        </>}

    </div>;
}
