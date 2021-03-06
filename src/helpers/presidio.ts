import axios from 'axios';

export interface PresidioItem {
  "analysis_explanation": unknown,
  "end": number,
  "entity_type": string,
  "score": number,
  "start": number
}

export type PresidioRes = PresidioItem[] | null;

export const identifyPII = async (dataString: string): Promise<PresidioRes> => {
  const res = await axios.post(process.env.PRESIDIO_ENDPOINT, {
    text: dataString,
    language: "en"
  })

  return res.data as PresidioRes;
}