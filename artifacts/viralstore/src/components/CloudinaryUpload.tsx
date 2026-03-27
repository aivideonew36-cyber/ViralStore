import { useState, useEffect } from "react";
import { UploadCloud, X } from "lucide-react";

interface CloudinaryUploadProps {
  onUploadSuccess: (url: string, publicId: string) => void;
  buttonText?: string;
  defaultPreview?: string;
}

export function CloudinaryUpload({ onUploadSuccess, buttonText = "Uploader une vidéo", defaultPreview }: CloudinaryUploadProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultPreview || null);

  useEffect(() => {
    // Load Cloudinary Widget script dynamically
    if (!document.getElementById("cloudinary-widget-script")) {
      const script = document.createElement("script");
      script.id = "cloudinary-widget-script";
      script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
      script.onload = () => setIsLoaded(true);
      document.body.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  const openWidget = () => {
    if (!isLoaded || !(window as any).cloudinary) return;

    // Use dummy/demo credentials if real ones aren't available for the prototype
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo";
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "docs_upload_example_us";

    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ["local", "url", "camera"],
        multiple: false,
        resourceType: "video",
        clientAllowedFormats: ["mp4", "mov", "webm"],
        maxFileSize: 50000000, // 50MB
        theme: "purple"
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setPreview(result.info.secure_url);
          onUploadSuccess(result.info.secure_url, result.info.public_id);
        }
      }
    );
    widget.open();
  };

  return (
    <div className="w-full">
      {!preview ? (
        <button
          type="button"
          onClick={openWidget}
          disabled={!isLoaded}
          className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-all duration-300 disabled:opacity-50"
        >
          <UploadCloud className="w-10 h-10 text-primary mb-3" />
          <span className="font-medium text-foreground">{buttonText}</span>
          <span className="text-xs text-muted-foreground mt-2">Format vertical (TikTok) recommandé. Max 50Mo.</span>
        </button>
      ) : (
        <div className="relative w-full aspect-[9/16] max-h-[400px] mx-auto rounded-2xl overflow-hidden border border-border group">
          <video src={preview} className="w-full h-full object-cover" controls playsInline />
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
