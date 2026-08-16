import { BookOpen, ChevronDown, Edit3, FileArchive, FileImage, FileText, LoaderCircle, Music, Plus, Trash2, Video } from "lucide-react";
import { useState } from "react";
import { DocumentUploader, ThumbnailUploader, VideoUploader } from "../../../../components/upload";
const initialModule = {
  title: "",
  description: "",
  order: 1,
  isActive: true
};
const initialResource = {
  title: "",
  description: "",
  type: "ARTICLE",
  articleContent: "",
  video: null,
  file: null,
  image: null,
  externalUrl: "",
  thumbnailUrl: "",
  durationMinutes: 5,
  order: 1,
  isPreview: false,
  isDownloadable: false,
  isActive: true
};
function getResourceIcon(type) {
  if (type === "VIDEO") return <Video size={18} />;
  if (type === "IMAGE") return <FileImage size={18} />;
  if (type === "ZIP") return <FileArchive size={18} />;
  if (type === "AUDIO") return <Music size={18} />;
  return <FileText size={18} />;
}
function validateResource(form) {
  if (!form.title.trim()) {
    return "Le titre de la ressource est obligatoire.";
  }
  if (form.type === "ARTICLE" && !form.articleContent.trim()) {
    return "Le contenu de l’article est obligatoire.";
  }
  if (form.type === "VIDEO" && !form.video?.url) {
    return "Téléversez une vidéo avant d’ajouter la ressource.";
  }
  if (["PDF", "DOCUMENT", "ZIP", "AUDIO"].includes(form.type) && !form.file?.url) {
    return "Téléversez un fichier avant d’ajouter la ressource.";
  }
  if (form.type === "IMAGE" && !form.image?.url) {
    return "Téléversez une image avant d’ajouter la ressource.";
  }
  return "";
}
export default function CourseModulesTab({
  course,
  busy,
  onAddModule,
  onUpdateModule,
  onDeleteModule,
  onAddResource,
  onDeleteResource
}) {
  const [openModules, setOpenModules] = useState([]);
  const [moduleForm, setModuleForm] = useState(initialModule);
  const [resourceModuleId, setResourceModuleId] = useState(null);
  const [resourceForm, setResourceForm] = useState(initialResource);
  const [resourceError, setResourceError] = useState("");
  const modules = [...(course?.modules || [])].sort((first, second) => Number(first.order) - Number(second.order));
  const toggle = id => {
    setOpenModules(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };
  const closeResourceModal = () => {
    setResourceModuleId(null);
    setResourceForm(initialResource);
    setResourceError("");
  };
  const openResourceModal = moduleId => {
    const module = modules.find(item => String(item._id) === moduleId);
    setResourceModuleId(moduleId);
    setResourceError("");
    setResourceForm({
      ...initialResource,
      order: (module?.resources?.length || 0) + 1
    });
  };
  const submitModule = async event => {
    event.preventDefault();
    await onAddModule({
      ...moduleForm,
      title: moduleForm.title.trim(),
      description: moduleForm.description.trim(),
      order: Number(moduleForm.order)
    });
    setModuleForm({
      ...initialModule,
      order: modules.length + 2
    });
  };
  const submitResource = async event => {
    event.preventDefault();
    const validationMessage = validateResource(resourceForm);
    if (validationMessage) {
      setResourceError(validationMessage);
      return;
    }
    setResourceError("");
    const durationMinutes = Math.max(Number(resourceForm.durationMinutes) || 0, 0);
    const payload = {
      title: resourceForm.title.trim(),
      description: resourceForm.description.trim(),
      type: resourceForm.type,
      durationSeconds: Math.round(durationMinutes * 60),
      order: Math.max(Number(resourceForm.order) || 1, 1),
      isPreview: Boolean(resourceForm.isPreview),
      isDownloadable: Boolean(resourceForm.isDownloadable),
      isActive: Boolean(resourceForm.isActive),
      articleContent: resourceForm.type === "ARTICLE" ? resourceForm.articleContent.trim() : "",
      video: resourceForm.type === "VIDEO" ? resourceForm.video : null,
      file: ["PDF", "DOCUMENT", "ZIP", "AUDIO"].includes(resourceForm.type) ? resourceForm.file : null,
      image: resourceForm.type === "IMAGE" ? resourceForm.image : null,
      externalUrl: resourceForm.externalUrl.trim(),
      thumbnailUrl: resourceForm.thumbnailUrl.trim()
    };
    await onAddResource(resourceModuleId, payload);
    closeResourceModal();
  };
  const changeResourceType = type => {
    setResourceError("");
    setResourceForm(current => ({
      ...current,
      type,
      articleContent: "",
      video: null,
      file: null,
      image: null,
      externalUrl: "",
      thumbnailUrl: "",
      isDownloadable: false
    }));
  };
  return <div className="space-y-7">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">
          Ajouter un module
        </h2>

        <form onSubmit={submitModule} className="mt-5 grid gap-4 md:grid-cols-[2fr_3fr_100px_auto] md:items-end">
          <label className="text-sm font-bold text-slate-700">
            Titre
            <input required value={moduleForm.title} onChange={event => setModuleForm(current => ({
            ...current,
            title: event.target.value
          }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" />
          </label>

          <label className="text-sm font-bold text-slate-700">
            Description
            <input value={moduleForm.description} onChange={event => setModuleForm(current => ({
            ...current,
            description: event.target.value
          }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" />
          </label>

          <label className="text-sm font-bold text-slate-700">
            Ordre
            <input type="number" min="1" value={moduleForm.order} onChange={event => setModuleForm(current => ({
            ...current,
            order: event.target.value
          }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" />
          </label>

          <button disabled={busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-black text-white disabled:opacity-60">
            {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Plus size={18} />}
            Ajouter
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {modules.length === 0 && <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <BookOpen size={44} className="mx-auto text-emerald-600" />
            <h3 className="mt-4 text-xl font-black">Aucun module</h3>
          </div>}

        {modules.map(module => {
        const moduleId = String(module._id);
        const open = openModules.includes(moduleId);
        return <article key={moduleId} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-4 p-5">
                <button type="button" onClick={() => toggle(moduleId)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 font-black text-emerald-600">
                    {module.order}
                  </span>

                  <div className="min-w-0">
                    <h3 className="font-black text-slate-950">
                      {module.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {module.resources?.length || 0} ressource(s)
                    </p>
                  </div>

                  <ChevronDown className={`ml-auto transition ${open ? "rotate-180" : ""}`} />
                </button>

                <button type="button" onClick={() => openResourceModal(moduleId)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-black text-emerald-600">
                  <Plus size={16} />
                  Ressource
                </button>

                <button type="button" onClick={() => {
              const title = window.prompt("Nouveau titre", module.title);
              if (title?.trim()) {
                onUpdateModule(moduleId, {
                  title: title.trim()
                });
              }
            }} className="flex size-10 items-center justify-center rounded-xl border border-slate-200">
                  <Edit3 size={17} />
                </button>

                <button type="button" onClick={() => window.confirm("Supprimer ce module ?") && onDeleteModule(moduleId)} className="flex size-10 items-center justify-center rounded-xl border border-red-200 text-red-600">
                  <Trash2 size={17} />
                </button>
              </div>

              {open && <div className="border-t border-slate-100 bg-slate-50 p-5">
                  <div className="space-y-3">
                    {(module.resources || []).map(resource => {
                const resourceMinutes = Math.ceil(Number(resource.durationSeconds ?? (resource.durationMinutes || 0) * 60) / 60);
                return <div key={resource._id} className="flex items-center gap-4 rounded-2xl bg-white p-4">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            {getResourceIcon(resource.type)}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-900">
                              {resource.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {resource.type} · {resourceMinutes} min
                            </p>
                          </div>

                          <button type="button" onClick={() => window.confirm("Supprimer cette ressource ?") && onDeleteResource(moduleId, resource._id)} className="flex size-9 items-center justify-center rounded-xl text-red-600">
                            <Trash2 size={17} />
                          </button>
                        </div>;
              })}

                    {!module.resources?.length && <p className="text-center text-sm text-slate-500">
                        Aucune ressource.
                      </p>}
                  </div>
                </div>}
            </article>;
      })}
      </section>

      {resourceModuleId && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-5">
          <form onSubmit={submitResource} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black">Nouvelle ressource</h2>
              <button type="button" onClick={closeResourceModal} className="rounded-xl px-3 py-2 font-bold text-slate-500">
                Fermer
              </button>
            </div>

            {resourceError && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {resourceError}
              </div>}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold sm:col-span-2">
                Titre
                <input required value={resourceForm.title} onChange={event => setResourceForm(current => ({
              ...current,
              title: event.target.value
            }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" />
              </label>

              <label className="text-sm font-bold sm:col-span-2">
                Description
                <textarea rows={3} value={resourceForm.description} onChange={event => setResourceForm(current => ({
              ...current,
              description: event.target.value
            }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" />
              </label>

              <label className="text-sm font-bold">
                Type
                <select value={resourceForm.type} onChange={event => changeResourceType(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3">
                  <option value="ARTICLE">Article</option>
                  <option value="VIDEO">Vidéo</option>
                  <option value="IMAGE">Image</option>
                  <option value="PDF">PDF</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="ZIP">Archive ZIP</option>
                  <option value="AUDIO">Audio</option>
                  <option value="EXERCISE">Exercice</option>
                  <option value="QUIZ">Quiz</option>
                </select>
              </label>

              <label className="text-sm font-bold">
                Durée (min)
                <input type="number" min="0" value={resourceForm.durationMinutes} onChange={event => setResourceForm(current => ({
              ...current,
              durationMinutes: event.target.value
            }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" />
              </label>

              {resourceForm.type === "VIDEO" && <div className="sm:col-span-2">
                  <VideoUploader value={resourceForm.video} onChange={video => setResourceForm(current => ({
              ...current,
              video,
              thumbnailUrl: video?.thumbnailUrl || current.thumbnailUrl
            }))} />
                </div>}

              {resourceForm.type === "IMAGE" && <div className="sm:col-span-2">
                  <ThumbnailUploader value={resourceForm.image} onChange={image => setResourceForm(current => ({
              ...current,
              image
            }))} />
                </div>}

              {["PDF", "DOCUMENT", "ZIP", "AUDIO"].includes(resourceForm.type) && <div className="sm:col-span-2">
                  <DocumentUploader value={resourceForm.file} onChange={file => setResourceForm(current => ({
              ...current,
              file
            }))} />
                </div>}

              {resourceForm.type === "ARTICLE" && <label className="text-sm font-bold sm:col-span-2">
                  Contenu
                  <textarea required rows={8} value={resourceForm.articleContent} onChange={event => setResourceForm(current => ({
              ...current,
              articleContent: event.target.value
            }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" />
                </label>}

              {resourceForm.type === "EXERCISE" && <label className="text-sm font-bold sm:col-span-2">
                  Consigne ou lien externe
                  <textarea rows={5} value={resourceForm.externalUrl} onChange={event => setResourceForm(current => ({
              ...current,
              externalUrl: event.target.value
            }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" />
                </label>}

              <label className="flex items-center gap-2 font-bold">
                <input type="checkbox" checked={resourceForm.isPreview} onChange={event => setResourceForm(current => ({
              ...current,
              isPreview: event.target.checked
            }))} />
                Aperçu public
              </label>

              {["PDF", "DOCUMENT", "ZIP", "AUDIO"].includes(resourceForm.type) && <label className="flex items-center gap-2 font-bold">
                  <input type="checkbox" checked={resourceForm.isDownloadable} onChange={event => setResourceForm(current => ({
              ...current,
              isDownloadable: event.target.checked
            }))} />
                  Téléchargement autorisé
                </label>}
            </div>

            <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white disabled:opacity-60">
              {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Plus size={18} />}
              Ajouter la ressource
            </button>
          </form>
        </div>}
    </div>;
}
