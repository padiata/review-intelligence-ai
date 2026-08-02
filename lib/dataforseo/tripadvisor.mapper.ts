import type { NormalizedReview } from "./review.types";

export function mapTripadvisorTaskToReviews(taskGet: any): NormalizedReview[] {
  const result = taskGet?.tasks?.[0]?.result?.[0];

  const propertyName = result?.title ?? null;
  const propertyUrl = result?.check_url ?? null;

  const items = result?.items ?? [];

  return items.map((item: any): NormalizedReview => {
    const response = item?.responses?.[0] ?? null;

    return {
      source: "tripadvisor",

      sourceReviewId: item?.review_id ?? null,

      propertyName,
      propertyUrl,

      reviewTitle: item?.title ?? null,
      reviewText: item?.review_text ?? null,
      rating:
        typeof item?.rating?.value === "number"
          ? item.rating.value
          : typeof item?.rating === "number"
            ? item.rating
            : null,

      reviewDate: item?.timestamp ?? null,
      visitDate: item?.date_of_visit ?? null,

      language: item?.language ?? null,
      originalLanguage: item?.original_language ?? null,

      reviewerName: item?.user_profile?.name ?? null,
      reviewerUrl: item?.user_profile?.url ?? null,
      reviewerImageUrl: item?.user_profile?.image_url ?? null,
      reviewerReviewsCount:
        typeof item?.user_profile?.reviews_count === "number"
          ? item.user_profile.reviews_count
          : null,

      ownerResponseText: response?.text ?? null,
      ownerResponseDate: response?.timestamp ?? null,
      ownerResponseAuthor: response?.title ?? response?.author ?? null,

      rawPayload: item,
    };
  });
}