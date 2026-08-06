import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";
import { uploadImage } from "../../services/upload.service";
import UploadProgress from "./UploadProgress";

export default function ThumbnailUploader({
  value,
  onChange,
}) {
  const { token } = useAuth();

  const inputRef = useRef();

  const [uploading, setUploading] = useState(false);

  const [progress, setProgress] = useState(0);

  async function chooseFile(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const result = await uploadImage(
        token,
        file,
        setProgress,
      );

      onChange(result.file);
    } finally {
      setUploading(false);

      setProgress(0);
    }
  }

  return (
    <div className="space-y-4">

      {value?.url ? (

        <div className="overflow-hidden rounded-2xl border">

          <img
            src={value.url}
            alt=""
            className="h-56 w-full object-cover"
          />

        </div>

      ) : (

        <button
          type="button"
          onClick={() => inputRef.current.click()}
          className="flex h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500"
        >
          <ImagePlus size={40} />

          <span className="mt-4 font-bold">
            Choisir une miniature
          </span>
        </button>

      )}

      <input
        hidden
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={chooseFile}
      />

      {uploading && (
        <UploadProgress
          progress={progress}
        />
      )}

      {value?.url && (

        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-3 font-bold text-white"
        >
          <Trash2 size={18} />

          Supprimer
        </button>

      )}

      {uploading && (

        <div className="flex items-center gap-3 text-indigo-600">

          <LoaderCircle className="animate-spin" />

          Téléversement...

        </div>

      )}

    </div>
  );
}