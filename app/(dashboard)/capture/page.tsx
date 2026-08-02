import PageHeader from "@/components/layout/PageHeader";
import ReviewCapturePanel from "@/components/capture/ReviewCapturePanel";

export default function CapturePage() {
  return (
    <>
      <PageHeader
        eyebrow="Sincronización"
        title="Captura de reviews"
        description="Descarga e importa nuevas reseñas desde las fuentes configuradas."
      />

      <ReviewCapturePanel />
    </>
  );
}