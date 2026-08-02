export type NormalizedReviewSource = "tripadvisor" | "google" | "trustpilot" | "airbnb";

export type NormalizedReview = {
  source: NormalizedReviewSource;

  sourceReviewId: string | null;

  propertyName: string | null;
  propertyUrl: string | null;

  reviewTitle: string | null;
  reviewText: string | null;
  rating: number | null;

  reviewDate: string | null;
  visitDate: string | null;

  language: string | null;
  originalLanguage: string | null;

  reviewerName: string | null;
  reviewerUrl: string | null;
  reviewerImageUrl: string | null;
  reviewerReviewsCount: number | null;

  ownerResponseText: string | null;
  ownerResponseDate: string | null;
  ownerResponseAuthor: string | null;

  rawPayload: unknown;
};