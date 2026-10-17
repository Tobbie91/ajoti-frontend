import { useEffect, useRef, useState } from "react";
import { Alert, Loader, Text } from "@mantine/core";
import { IconAlertCircle, IconArrowLeft, IconShieldCheck } from "@tabler/icons-react";
import { ApiError, submitSmileCapture } from "@/utils/api";

type SmileCaptureImage = { image: string; image_type_id: number | string };
type SmileCapturePublished = { images?: SmileCaptureImage[] };

function imageToFile(value: string, name: string): File {
  const dataUrl = /^data:(image\/jpeg);base64,(.+)$/i.exec(value);
  const encoded = dataUrl?.[2] ?? value;
  const binary = window.atob(encoded.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], name, { type: "image/jpeg" });
}

export function SmileIdCapture({
  onSubmitted,
  onCancel,
}: {
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const uploadingRef = useRef(false);
  const onSubmittedRef = useRef(onSubmitted);
  const onCancelRef = useRef(onCancel);
  const [loadingComponent, setLoadingComponent] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureReady, setCaptureReady] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    onSubmittedRef.current = onSubmitted;
    onCancelRef.current = onCancel;
  }, [onCancel, onSubmitted]);

  useEffect(() => {
    let active = true;
    let captureElement: HTMLElement | undefined;

    const handlePublished = async (event: Event) => {
      if (uploadingRef.current) return;
      const published = (event as CustomEvent<SmileCapturePublished>).detail;
      const images = published?.images ?? [];
      const selfie = images.find((image) => Number(image.image_type_id) === 2);
      const liveness = images.filter((image) => Number(image.image_type_id) === 6);
      if (!selfie || liveness.length < 6 || liveness.length > 8) {
        setError("Smile ID could not prepare the required selfie and liveness images. Please capture again.");
        return;
      }

      uploadingRef.current = true;
      setUploading(true);
      setError(null);
      try {
        const files = new FormData();
        files.append("selfieImage", imageToFile(selfie.image, "selfie.jpg"));
        liveness.forEach((image, index) => {
          files.append("livenessImages", imageToFile(image.image, `liveness-${index + 1}.jpg`));
        });
        await submitSmileCapture(files);
        onSubmittedRef.current();
      } catch (uploadError) {
        setError(
          uploadError instanceof ApiError || uploadError instanceof Error
            ? uploadError.message
            : "Unable to submit your Smile ID capture. Please try again.",
        );
      } finally {
        uploadingRef.current = false;
        if (active) setUploading(false);
      }
    };

    const handleCancelled = () => onCancelRef.current();

    void import("@smileid/web-components/selfie-capture")
      .then(() => {
        if (!active || !hostRef.current) return;
        captureElement = document.createElement("selfie-capture-screens");
        captureElement.setAttribute("use-strict-mode", "true");
        captureElement.setAttribute("hide-back-to-host", "");
        captureElement.setAttribute("theme-color", "#02A36E");
        captureElement.style.display = "block";
        captureElement.style.minHeight = "520px";
        captureElement.addEventListener("selfie-capture-screens.publish", handlePublished);
        captureElement.addEventListener("selfie-capture-screens.cancelled", handleCancelled);
        hostRef.current.replaceChildren(captureElement);
        setCaptureReady(true);
      })
      .catch(() => {
        if (active) setError("Smile ID camera capture could not be loaded. Check your connection and retry.");
      })
      .finally(() => {
        if (active) setLoadingComponent(false);
      });

    return () => {
      active = false;
      captureElement?.removeEventListener("selfie-capture-screens.publish", handlePublished);
      captureElement?.removeEventListener("selfie-capture-screens.cancelled", handleCancelled);
      captureElement?.remove();
    };
  }, [retryVersion]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-6 py-8">
      <div className="mx-auto max-w-[600px]">
        <button
          type="button"
          onClick={onCancel}
          className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
        >
          <IconArrowLeft size={18} />
          Back
        </button>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <IconShieldCheck size={22} color="#02A36E" />
            <div>
              <Text fw={700} className="text-[17px] text-[#0F172A]">Smile ID selfie check</Text>
              <Text size="sm" c="dimmed">Follow the camera instructions to capture your selfie and liveness images.</Text>
            </div>
          </div>
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
              {error}
            </Alert>
          )}
          {uploading && (
            <Alert color="blue" mb="md" title="Sending securely">
              Your capture is being sent to Smile ID for separate NIN and BVN checks. Ajoti does not keep the image files.
            </Alert>
          )}
          {!captureReady && loadingComponent && (
            <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm text-[#6B7280]">
              <Loader size="sm" color="#02A36E" /> Loading secure camera capture…
            </div>
          )}
          <div ref={hostRef} aria-busy={loadingComponent || uploading} />
          {error && !loadingComponent && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setLoadingComponent(true);
                setRetryVersion((version) => version + 1);
              }}
              className="mt-4 w-full rounded-xl bg-[#02A36E] px-5 py-3 text-sm font-semibold text-white"
            >
              Retry camera setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
