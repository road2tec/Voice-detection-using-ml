const { GoogleGenerativeAI } = require('@google/generative-ai');

const LABEL_MAP = {
  fire: 'Fire',
  gunshot: 'Gunshot',
  vehicle: 'Vehicle',
  unknown: 'Unknown',
};

const getSafeUnknownResult = () => ({
  label: 'Unknown',
  danger: false,
  confidence: null,
  reason: 'Could not confidently classify the audio.',
  modelUsed: null,
});

const normalizeMimeType = (mimeType) => {
  const raw = String(mimeType || '').toLowerCase();

  if (raw.includes('wav')) {
    return 'audio/wav';
  }

  if (raw.includes('webm')) {
    return 'audio/webm';
  }

  if (raw.includes('mpeg') || raw.includes('mp3')) {
    return 'audio/mpeg';
  }

  if (raw.includes('mp4') || raw.includes('m4a')) {
    return 'audio/mp4';
  }

  return 'audio/webm';
};

const normalizeLabel = (rawText) => {
  const text = String(rawText || '').toLowerCase();

  if (
    text.includes('gun') ||
    text.includes('gunshot') ||
    text.includes('shot') ||
    text.includes('blast') ||
    text.includes('explosion') ||
    text.includes('bang')
  ) {
    return 'Gunshot';
  }

  if (text.includes('fire') || text.includes('smoke') || text.includes('crackle') || text.includes('alarm')) {
    return 'Fire';
  }

  if (
    text.includes('vehicle') ||
    text.includes('car') ||
    text.includes('truck') ||
    text.includes('engine') ||
    text.includes('traffic') ||
    text.includes('bike') ||
    text.includes('motorcycle') ||
    text.includes('bus') ||
    text.includes('horn') ||
    text.includes('siren')
  ) {
    return 'Vehicle';
  }

  if (text.includes('unknown')) {
    return 'Unknown';
  }

  return LABEL_MAP[text] || 'Unknown';
};

const isDangerous = (label) => label === 'Fire' || label === 'Gunshot';

const extractJsonFromText = (text) => {
  const trimmed = String(text || '').replace(/```json|```/gi, '').trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const parseConfidence = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  let confidence = Number(value);

  if (!Number.isFinite(confidence)) {
    return null;
  }

  if (confidence > 1 && confidence <= 100) {
    confidence = confidence / 100;
  }

  if (confidence < 0 || confidence > 1) {
    return null;
  }

  return confidence;
};

const getModelCandidates = () => {
  const candidates = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001',
    'gemini-flash-latest',
    'gemini-pro-latest',
  ].filter(Boolean);

  return [...new Set(candidates)];
};

const detectLabelFromTextHeuristic = (inputText) => {
  const text = String(inputText || '').toLowerCase();

  if (/gun|gunshot|9mm|shot|firearm|pistol|rifle|blast|explosion|bang/.test(text)) {
    return 'Gunshot';
  }

  if (/fire|alarm|smoke|burn|crackle/.test(text)) {
    return 'Fire';
  }

  if (/vehicle|traffic|car|truck|engine|motor|bike|bus|horn|siren/.test(text)) {
    return 'Vehicle';
  }

  return 'Unknown';
};

const analyzeAudioWithGemini = async (base64Audio, mimeType, originalFileName = '') => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !base64Audio) {
    return getSafeUnknownResult();
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);

    const prompt = [
      'You are an audio event classifier.',
      'Analyze this audio and classify to ONE label: fire, gunshot, vehicle, or unknown.',
      'If uncertain, still return your best guess among these labels.',
      'Return strict JSON only: {"label":"fire|gunshot|vehicle|unknown","confidence":0.0,"reason":"short reason"}',
      'Do not return markdown.',
    ].join(' ');

    const normalizedMimeType = normalizeMimeType(mimeType);
    const modelCandidates = getModelCandidates();
    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        const model = client.getGenerativeModel({ model: modelName });

        const response = await model.generateContent([
          {
            inlineData: {
              data: base64Audio,
              mimeType: normalizedMimeType,
            },
          },
          prompt,
        ]);

        const text = response?.response?.text?.() || '';
        const parsed = extractJsonFromText(text);

        const labelSource = parsed?.label || text;
        const label = normalizeLabel(labelSource);
        const confidence = parseConfidence(parsed?.confidence);
        const reason = String(parsed?.reason || '').trim() || null;

        return {
          label,
          danger: isDangerous(label),
          confidence,
          reason,
          modelUsed: modelName,
        };
      } catch (modelError) {
        lastError = modelError;
        console.warn(`Gemini model failed (${modelName}):`, modelError.message);
      }
    }

    const errorMessage = String(lastError?.message || 'Unknown Gemini error');
    const fallbackLabel = detectLabelFromTextHeuristic(originalFileName);
    const fallbackDanger = isDangerous(fallbackLabel);

    if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
      return {
        label: fallbackLabel,
        danger: fallbackDanger,
        confidence: null,
        reason:
          fallbackLabel === 'Unknown'
            ? 'Gemini quota exceeded. Please enable billing/increase quota for accurate detection.'
            : `Gemini quota exceeded. Applied filename-based fallback detection (${fallbackLabel}).`,
        modelUsed: null,
      };
    }

    if (errorMessage.includes('404')) {
      return {
        label: fallbackLabel,
        danger: fallbackDanger,
        confidence: null,
        reason:
          fallbackLabel === 'Unknown'
            ? 'Gemini model unavailable for this API key. Configure a supported model in server/.env.'
            : `Gemini model unavailable. Applied filename-based fallback detection (${fallbackLabel}).`,
        modelUsed: null,
      };
    }

    console.error('All Gemini models failed:', errorMessage);
    return {
      ...getSafeUnknownResult(),
      reason: errorMessage,
    };
  } catch (error) {
    console.error('Gemini analysis failed:', error.message);
    return {
      ...getSafeUnknownResult(),
      reason: error.message,
    };
  }
};

module.exports = {
  analyzeAudioWithGemini,
};
