"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import AnalysisPanel from "@/components/reviews/AnalysisPanel";
import ContextCard from "@/components/reviews/ContextCard";
import ResponseEditor from "@/components/reviews/ResponseEditor";
import ReviewCard from "@/components/reviews/ReviewCard";
import WorkflowPanel from "@/components/reviews/WorkflowPanel";

import {
  translationLanguages,
  useReviewWorkspace,
} from "@/hooks/useReviewWorkspace";

export default function ReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const reviewId = Number(params.id);

  const workspace = useReviewWorkspace({
    reviewId,
  });

  if (
    !workspace.loadingReview &&
    !workspace.review.id
  ) {
    return (
      <section className="panel">
        <Link href="/reviews">
          ← Volver a Reviews
        </Link>

        <h2>Review no disponible</h2>

        <p role="alert">
          {workspace.reviewError ||
            "No se encontró la review solicitada."}
        </p>
      </section>
    );
  }

  return (
    <>
      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <Link href="/reviews">
          ← Volver a Reviews
        </Link>
      </div>

      <div className="content-grid">
        <section className="main-column">
          <ReviewCard
            review={workspace.review}
            sources={
              workspace.selectedSource
                ? [workspace.selectedSource]
                : workspace.sources
            }
            selectedSourceId={
              workspace.selectedSourceId
            }
            status={workspace.status}
            loadingSources={
              workspace.loadingSources
            }
            loadingReview={
              workspace.loadingReview
            }
            sourceError={
              workspace.sourceError
            }
            reviewError={
              workspace.reviewError
            }
            onSourceChange={
              workspace.setSelectedSourceId
            }
            onStatusChange={
              workspace.setStatus
            }
          />

          <ContextCard
            context={workspace.context}
            voiceActive={
              workspace.voiceActive
            }
            onContextChange={
              workspace.changeContext
            }
            onToggleVoice={
              workspace.toggleVoice
            }
          />

          <ResponseEditor
            tone={workspace.tone}
            translationLanguage={
              workspace.translationLanguage
            }
            translationLanguages={
              translationLanguages
            }
            response={workspace.response}
            isTranslated={
              workspace.isTranslated
            }
            isTranslating={
              workspace.isTranslating
            }
            isGeneratingResponse={
              workspace.isGeneratingResponse
            }
            isSavingDraft={
              workspace.isSavingDraft
            }
            loadingReview={
              workspace.loadingReview
            }
            reviewId={
              workspace.review.id
            }
            sourceReviewUrl={
              workspace.review
                .source_review_url
            }
            generationError={
              workspace.generationError
            }
            translationError={
              workspace.translationError
            }
            saved={workspace.saved}
            sourceName={
              workspace.selectedSource
                ?.source_name
            }
            onToneChange={
              workspace.changeTone
            }
            onTranslationLanguageChange={
              workspace.changeTranslationLanguage
            }
            onResponseChange={
              workspace.changeResponse
            }
            onGenerateResponse={() =>
              void workspace.generateResponse()
            }
            onTranslateResponse={() =>
              void workspace.translateResponse()
            }
            onRestoreOriginal={
              workspace.restoreOriginalResponse
            }
            onCopyAndOpenSource={() =>
              void workspace.copyAndOpenSourceReview()
            }
            onSaveDraft={() =>
              void workspace.saveDraft()
            }
          />
        </section>

        <aside className="right-column">
          <AnalysisPanel
            analysis={workspace.analysis}
            selectedSource={
              workspace.selectedSource
            }
            loadingSources={
              workspace.loadingSources
            }
            isAnalyzing={
              workspace.isAnalyzing
            }
            analysisError={
              workspace.analysisError
            }
          />

          <WorkflowPanel />
        </aside>
      </div>
    </>
  );
}
