import {
  Film,
  LoaderCircle,
  Play,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";
import { uploadVideo } from "../../services/upload.service";
import UploadProgress from "./UploadProgress";

export default function VideoUploader({
  value,
  onChange,
}) {
  const { token } = useAuth();

  const inputRef = useRef();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const response = await uploadVideo(
        token,
        file,
        setProgress,
      );

      onChange(response.file);

    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Impossible d'envoyer la vidéo.",
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="space-y-5">

      {!value?.url ? (
        <button
          type="button"
          onClick={() => inputRef.current.click()}
          className="flex h-60 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white hover:border-indigo-600"
        >
          <Film size={50} />

          <span className="mt-4 font-black">
            Ajouter une vidéo
          </span>

          <span className="mt-1 text-sm text-slate-500">
            mp4 • mov • avi
          </span>
        </button>
      ) : (
        <div className="overflow-hidden rounded-3xl border bg-white">

          <video
            src={value.url}
            controls
            className="h-80 w-full bg-black"
          />

          <div className="flex items-center justify-between p-5">

            <div>

              <p className="font-black">
                Vidéo envoyée
              </p>

              <p className="text-sm text-slate-500">
                {value.format}
              </p>

            </div>

            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-xl bg-red-500 p-3 text-white"
            >
              <Trash2 size={20} />
            </button>

          </div>

        </div>
      )}

      <input
        hidden
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleSelect}
      />

      {uploading && (
        <>
          <UploadProgress progress={progress} />

          <div className="flex items-center gap-3 text-indigo-600 font-bold">

            <LoaderCircle className="animate-spin" />

            Téléversement...

          </div>
        </>
      )}
    </div>
  );
}