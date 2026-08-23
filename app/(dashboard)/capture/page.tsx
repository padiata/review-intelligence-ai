"use client";

import PageHeader from "@/components/layout/PageHeader";
import ReviewCapturePanel from "@/components/capture/ReviewCapturePanel";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

export default function CapturePage() {
  const {
    messages,
  } = useLanguage();

  const capture =
    messages.capture;

  return (
    <>
      <PageHeader
        eyebrow={
          capture.page.eyebrow
        }
        title={
          capture.page.title
        }
        description={
          capture.page.description
        }
      />

      <ReviewCapturePanel />
    </>
  );
}