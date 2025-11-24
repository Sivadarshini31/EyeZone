
import { GoogleGenAI, Modality } from "@google/genai";
import { AppFile } from '../types';

let pdfWorkerInitialized = false;

// Helper to safely access the global pdfjsLib object
const getPdfLib = () => (window as any).pdfjsLib;

// Set worker source for pdf.js, which is loaded via CDN in index.html, only when needed.
const initializePdfWorker = () => {
    const pdfLib = getPdfLib();
    if (!pdfWorkerInitialized && pdfLib) {
        pdfLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
        pdfWorkerInitialized = true;
    }
};

export const extractTextFromFile = async (file: AppFile): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  if (file.type === 'pdf') {
    const pdfLib = getPdfLib();
    if (!pdfLib) {
        console.error("pdf.js library is not loaded.");
        return "Error: PDF processing library failed to load.";
    }
    
    initializePdfWorker(); // Ensure worker is configured before use

    try {
        const base64Data = file.content.split(',')[1];
        const pdfData = atob(base64Data);
        const uint8Array = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) {
            uint8Array[i] = pdfData.charCodeAt(i);
        }

        const pdf = await pdfLib.getDocument({ data: uint8Array }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            if (!textContent.items || textContent.items.length === 0) {
                continue;
            }

            // Sort items by their vertical position, then horizontal, to reconstruct reading order.
            const items = textContent.items.slice().sort((a: any, b: any) => {
                if (a.transform[5] !== b.transform[5]) {
                    return b.transform[5] - a.transform[5]; // Higher Y value is lower on the page.
                }
                return a.transform[4] - b.transform[4]; // Lower X value is to the left.
            });

            let pageText = items[0].str;
            for (let j = 1; j < items.length; j++) {
                const prev = items[j-1];
                const curr = items[j];
                
                // Heuristic to detect a new line: if the vertical position is significantly different,
                // it's a new line. The threshold is half the height of the previous text item.
                if (Math.abs(curr.transform[5] - prev.transform[5]) > prev.height * 0.5) {
                    pageText += '\n' + curr.str;
                } else {
                    pageText += ' ' + curr.str;
                }
            }
            fullText += pageText + '\n\n';
        }

        if (!fullText.trim()) {
            // If client-side parsing yields no text (e.g., scanned PDF), trigger fallback.
            throw new Error("Client-side parsing found no text. Attempting AI fallback.");
        }

        return fullText.trim();

    } catch (error) {
        console.warn("Client-side PDF parsing failed:", error);
        console.log("Falling back to Gemini for PDF text extraction...");
        try {
            const pdfPart = {
                inlineData: {
                    data: file.content.split(',')[1],
                    mimeType: 'application/pdf',
                },
            };
            const textPart = {
                text: "Extract all text from this PDF document. Respond in the language of the text. If no text is found, respond with 'No text found in the document.'",
            };
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: { parts: [pdfPart, textPart] },
            });
            return response.text;
        } catch (geminiError) {
            console.error("Gemini fallback for PDF also failed:", geminiError);
            return "Error: Could not process the PDF file. The file might be corrupted or in an unsupported format.";
        }
    }
  }

  const imagePart = {
    inlineData: {
      data: file.content.split(',')[1],
      mimeType: 'image/jpeg', // Assuming jpeg, could be dynamic
    },
  };
  
  const textPart = {
    text: "Extract all text from this image. Respond in the language of the text. If no text is found, respond with 'No text found in the image.'",
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: { parts: [imagePart, textPart] },
  });

  return response.text;
};

export const describeImage = async (base64Image: string, targetLang: 'Tamil' | 'English'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  if (!base64Image) return 'No image provided to describe.';

  try {
    const imagePart = {
      inlineData: {
        data: base64Image.split(',')[1],
        mimeType: 'image/jpeg', // Assuming jpeg from resizeImage function
      },
    };
    
    const textPart = {
      text: `Describe this image for a person with low vision in ${targetLang}. Be concise but cover the main subject, setting, and key details. One or two sentences maximum.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text;
  } catch (error) {
    console.error("Error describing image:", error);
    return `I'm sorry, I couldn't analyze the image in ${targetLang}.`;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  if (!text) return '';
  // Sanitize text to prevent API errors.
  // First, remove list-style asterisks at the beginning of lines.
  const textWithoutAsterisks = text.replace(/^\s*\*\s*/gm, '');
  // Then, collapse all whitespace into single spaces.
  const sanitizedText = textWithoutAsterisks.replace(/\s+/g, ' ').trim();

  if (!sanitizedText) return ''; // Return if text is only whitespace

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: sanitizedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || '';
  } catch (error) {
    console.error("Error generating speech:", error);
    return '';
  }
};

export const translateText = async (text: string, targetLang: 'Tamil' | 'English'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (!text) return '';
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: `Translate the following text to ${targetLang}: "${text}"`,
        });
        return response.text;
    } catch (error) {
        console.error(`Error translating text to ${targetLang}:`, error);
        return `Translation failed. Original text: ${text}`;
    }
};

export const getAiChatResponse = async (prompt: string, useThinkingMode: boolean): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (!prompt) return 'I did not hear your question. Please try again.';

    // Use gemini-2.5-flash as default to support tools (like googleSearch), upgrade to pro for thinking
    const model = useThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const config: any = {
        systemInstruction: 'You are EyeZone, a helpful and interactive AI assistant for people with low vision. You can read stories, answer questions, and assist with tasks in both English and Tamil. If the user asks to play a song, music, or video, DO NOT read the lyrics. Instead, use Google Search to find a valid YouTube link for the content and provide it in your response. Always act as a friendly, capable companion. Ensure your responses are clear.',
        tools: [{ googleSearch: {} }]
    };

    if (useThinkingMode) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config,
        });

        // Append grounding links if they exist and aren't already in the text to ensure UI can pick them up
        let text = response.text || '';
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            const links = chunks
                .map((c: any) => c.web?.uri)
                .filter((uri: string) => uri);
            
            const uniqueLinks = [...new Set(links)];
            if (uniqueLinks.length > 0) {
                 const newLinks = uniqueLinks.filter(link => !text.includes(link));
                 if (newLinks.length > 0) {
                     text += `\n\n${newLinks.join('\n')}`;
                 }
            }
        }

        return text;
    } catch (error) {
        console.error("Error getting AI chat response:", error);
        return "I'm sorry, I encountered an error and can't answer right now.";
    }
};
