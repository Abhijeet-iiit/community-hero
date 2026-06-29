import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../../../lib/supabaseClient';

// Initialize the modern Google Gen AI client using your environment API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // 1. Extract request payload from frontend
    const { image, mimeType, latitude, longitude } = await request.json();

    // Basic validation check
    if (!image || !mimeType || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required inputs: image, mimeType, latitude, or longitude' },
        { status: 400 }
      );
    }

    // Clean up base64 string prefix if it is passed from a FileReader (e.g., data:image/png;base64,)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // Format the image payload for the Google Gen AI SDK
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType, // e.g., 'image/jpeg' or 'image/png'
      },
    };

    // Strict JSON Schema enforcing deterministic output from Gemini
    const responseSchema = {
      type: 'object',
      properties: {
        category: { 
          type: 'string', 
          description: 'The primary civic infrastructure category. Must be one of: Roadwork, Waste Management, Utilities, Public Safety.' 
        },
        severity: { 
          type: 'string', 
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          description: 'The urgency or risk level of the issue.' 
        },
        brief_summary: { 
          type: 'string', 
          description: 'A concise 1-2 sentence description explaining exactly what is broken in the photo.' 
        },
        recommended_action: { 
          type: 'string', 
          description: 'Direct operational dispatch instructions for municipal maintenance crews.' 
        },
      },
      required: ['category', 'severity', 'brief_summary', 'recommended_action'],
    };

    // 2. Execute Multimodal AI analysis via Gemini 1.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        'You are an expert municipal infrastructure inspector. Analyze this image attached by a citizen reporting a community issue and categorize it accurately into the required structural format.',
        imagePart,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error('Gemini failed to return text analysis.');
    }

    // Parse string response from Gemini directly into a clean object
    const aiAnalysis = JSON.parse(textResult);

    // 3. Insert the integrated AI data straight into your Supabase Database
    const { data, error } = await supabase
      .from('issues')
      .insert([
        {
          category: aiAnalysis.category,
          severity: aiAnalysis.severity,
          summary: aiAnalysis.brief_summary,
          recommended_action: aiAnalysis.recommended_action,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          status: 'Open', // Defaults new issues to an Open status
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    // 4. Return successful database record to frontend to drop a map pin instantly
    return NextResponse.json({ success: true, databaseRecord: data[0] });

} catch (error: unknown) {
    console.error('Pipeline Processing Error:', error);
    
    // Safely extract the message without using 'any'
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    return NextResponse.json(
      { error: 'Failed to process hyper-local incident logging.', details: errorMessage },
      { status: 500 }
    );
  }}