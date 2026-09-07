import { z } from 'zod';

export const aiCandidateSchema = z.object({
  status: z.literal('AI_EXTRACTED_CANDIDATE'),
  herb: z.string().optional(), botanicalName: z.string().optional(), preparation: z.string().optional(), phytochemical: z.string().optional(), drug: z.string().optional(), dose: z.string().optional(), target: z.string().optional(), studyPopulation: z.string().optional(), studyDesign: z.string().optional(), sampleSize: z.string().optional(), pkOutcome: z.string().optional(), aucChange: z.string().optional(), cmaxChange: z.string().optional(), confidenceNotes: z.string(), source: z.object({ pmid: z.string().optional(), doi: z.string().optional(), title: z.string().optional() }),
});
export type AiCandidate = z.infer<typeof aiCandidateSchema>;

export function extractCandidate(input: { abstract?: string; pmid?: string; doi?: string; title?: string }): AiCandidate {
  const text = input.abstract?.trim() ?? '';
  return aiCandidateSchema.parse({ status: 'AI_EXTRACTED_CANDIDATE', confidenceNotes: text ? 'Candidate fields require human biotechnology review. No field is automatically validated.' : 'No abstract supplied; bibliographic metadata only.', source: { pmid: input.pmid, doi: input.doi, title: input.title } });
}
