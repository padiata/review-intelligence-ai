# Review Understanding v3

Only the Review Understanding files were reorganized. The aggregator, snapshots,
Tripadvisor sync, review import repository, processor repository and daily repository
remain in their original locations.

## New structure

- `services/review-understanding.service.ts`
- `repositories/review-understanding.repository.ts`
- `ai/review-understanding.ai.ts`
- `ai/prompts/review-understanding.prompt.ts`
- `validators/review-understanding.validator.ts`
- `mappers/review-understanding.mapper.ts`
- `types/review-understanding.types.ts`
- `constants/review-understanding.constants.ts`
- `sql/001_review_understanding_v3.sql`

The old `review-understanding.service.ts` remains as a compatibility export.

## Installation

1. Execute `sql/001_review_understanding_v3.sql` in Supabase.
2. Replace the current `/lib/reviews` folder with this one.
3. Ensure `OPENAI_API_KEY` is configured. The previous environment variable is
   still accepted as a fallback.
4. Set `REVIEW_UNDERSTANDING_DEBUG=true` only when detailed logs are needed.

No `processing_id` was added in this version.
