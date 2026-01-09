import axios from "axios";

/**
 * Generate image using AI
 * 
 * NOTE: Gemini API is used for TEXT generation only.
 * For IMAGE generation, we use Hugging Face's Stable Diffusion API (free tier).
 * 
 * Alternative: Google Imagen API (requires Vertex AI setup) could be used instead.
 */
async function generateImageWithAI(prompt) {
  // Use Hugging Face's Stable Diffusion API (free tier)
  // This is a DIFFERENT service from Gemini - Gemini only generates text, not images
  // NOTE: The new router endpoint requires an API key
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
  
  if (!HF_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY is required for image generation. Please add it to your environment variables. Get a free API key at: https://huggingface.co/settings/tokens");
  }

  try {
    const HF_API_URL = "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0";

    const headers = {
      "Content-Type": "application/json",
      "Accept": "image/png", // Request image response, not JSON
      "Authorization": `Bearer ${HF_API_KEY}`,
    };

    console.log("[Image Generation] Calling Hugging Face API...");
    const response = await axios.post(
      HF_API_URL,
      {
        inputs: prompt,
      },
      {
        headers,
        responseType: "arraybuffer",
        timeout: 60000, // 60 seconds timeout (image generation can take time)
      }
    );

    // Check if response is actually an image or an error
    if (response.headers['content-type']?.includes('application/json')) {
      // Response is JSON (error), not an image
      const errorData = JSON.parse(Buffer.from(response.data).toString());
      throw new Error(errorData.error || "Image generation service returned an error");
    }

    // Convert arraybuffer to base64
    const imageBuffer = Buffer.from(response.data);
    const imageBase64 = imageBuffer.toString("base64");
    
    console.log("[Image Generation] Image generated successfully, size:", imageBuffer.length, "bytes");
    return `data:image/png;base64,${imageBase64}`;
  } catch (error) {
    // Better error logging
    let errorMessage = "Image generation failed";
    
    if (error.response) {
      // Server responded with error
      const contentType = error.response.headers['content-type'];
      if (contentType?.includes('application/json')) {
        try {
          const errorData = JSON.parse(Buffer.from(error.response.data).toString());
          errorMessage = errorData.error || errorData.message || "Image generation service error";
          console.error("[Image Generation] API Error:", errorMessage);
        } catch (parseError) {
          errorMessage = Buffer.from(error.response.data).toString();
          console.error("[Image Generation] API Error (raw):", errorMessage);
        }
      } else {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
        console.error("[Image Generation] HTTP Error:", errorMessage);
      }
    } else if (error.message) {
      errorMessage = error.message;
      console.error("[Image Generation] Error:", errorMessage);
    }
    
    // Provide helpful error message
    if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      errorMessage = "Hugging Face API key is missing or invalid. Please set HUGGINGFACE_API_KEY in your environment variables. Get a free key at: https://huggingface.co/settings/tokens";
    }
    
    throw new Error(`${errorMessage}. Please try again or use 'Without Photo' option.`);
  }
}

export const generatePostContent = async (req, res) => {
  try {
    const { prompt, generateImage } = req.body;

    if (!prompt) {
      return res.status(400).json({
        message: "Prompt is required",
        status: false,
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API key is not configured",
        status: false,
      });
    }

    // Use Gemini 3 Pro Preview model for text generation
    const model = "gemini-2.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    // Build the request payload for text generation
    const parts = [
      {
        text: `Generate an engaging social media post caption based on this prompt: "${prompt}". 
        The caption should be:
        - Engaging and authentic
        - Appropriate for social media (Instagram, Facebook, LinkedIn, YouTube)
        - Include relevant hashtags if suitable
        - Be concise but compelling
        - Match the tone of the platform
        
        Return only the caption text, no additional formatting or explanations.`,
      },
    ];

    const requestBody = {
      contents: [
        {
          parts: parts,
        },
      ],
    };

    console.log("[Gemini] Generating TEXT content with prompt:", prompt);
    console.log("[Gemini] Generate image:", generateImage);

    // Generate TEXT content using Gemini API
    const textResponse = await axios.post(apiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const generatedText =
      textResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText) {
      return res.status(500).json({
        message: "Failed to generate content. Please try again.",
        status: false,
      });
    }

    // Generate image if requested (using Hugging Face API, NOT Gemini)
    let generatedImageBase64 = null;
    if (generateImage) {
      try {
        console.log("[Image Generation] Generating image using Hugging Face API (separate from Gemini) for prompt:", prompt);
        generatedImageBase64 = await generateImageWithAI(prompt);
        console.log("[Image Generation] Image generated successfully");
      } catch (imageError) {
        console.error("[Image Generation] Error:", imageError);
        // Return text with a note that image generation failed
        return res.status(200).json({
          message: "Text generated successfully, but image generation failed. You can try again or use 'Without Photo' option.",
          status: true,
          data: {
            content: generatedText.trim(),
            imageBase64: null,
            imageGenerationFailed: true,
          },
        });
      }
    }

    return res.status(200).json({
      message: "Content generated successfully",
      status: true,
      data: {
        content: generatedText.trim(),
        imageBase64: generatedImageBase64,
      },
    });
  } catch (error) {
    console.error("[Gemini] Error generating content:", error);
    const errorMessage =
      error?.response?.data?.error?.message ||
      error.message ||
      "Failed to generate content";

    return res.status(500).json({
      message: errorMessage,
      status: false,
    });
  }
};

