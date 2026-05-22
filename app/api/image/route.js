import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt');
  
  if (!prompt) {
    return new NextResponse('Missing prompt', { status: 400 });
  }

  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfApiKey) {
    return new NextResponse('Hugging Face API key not configured', { status: 500 });
  }

  const hf = new HfInference(hfApiKey);

  try {
    const blob = await hf.textToImage({
      inputs: prompt,
      model: 'black-forest-labs/FLUX.1-schnell',
    });

    const imageBuffer = await blob.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg', // HF often returns jpeg or png, we can just use image/jpeg or image/png
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image Generation Error:', error);
    return new NextResponse('Image generation failed', { status: 500 });
  }
}
