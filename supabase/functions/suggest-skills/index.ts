import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userSkills, popularSkills } = await req.json();

    const prompt = `You are an AI skill advisor for a skill-sharing platform. Based on the user's current skills and popular skills on the platform, suggest 3 complementary skills they could learn or teach.

User's current skills: ${userSkills.map((s: any) => `${s.skill_name} (${s.is_teaching ? 'teaching' : 'learning'})`).join(', ')}

Popular skills on platform: ${popularSkills.join(', ')}

Guidelines:
1. Suggest skills that complement their existing skills
2. Consider career progression and synergies
3. Include a mix of technical and soft skills if applicable
4. Prioritize skills that are in demand but not oversaturated
5. For each suggestion, specify if they should "learn" or "teach" it and why

Return EXACTLY 3 suggestions in this JSON format:
{
  "suggestions": [
    {
      "skill_name": "skill name",
      "type": "learn" or "teach",
      "reason": "brief explanation why this skill complements their profile",
      "category": "technical/creative/business/soft-skill"
    }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful AI skill advisor. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse the JSON response
    const suggestions = JSON.parse(aiResponse);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in suggest-skills function:', error);
    
    // Fallback suggestions if AI fails
    const fallbackSuggestions = {
      suggestions: [
        {
          skill_name: "Communication Skills",
          type: "learn",
          reason: "Essential for effective skill sharing and collaboration",
          category: "soft-skill"
        },
        {
          skill_name: "Project Management",
          type: "learn", 
          reason: "Complements technical skills and improves workflow",
          category: "business"
        },
        {
          skill_name: "Problem Solving",
          type: "teach",
          reason: "Share your analytical thinking with others",
          category: "soft-skill"
        }
      ]
    };

    return new Response(JSON.stringify(fallbackSuggestions), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});