export async function analyzeEmail(subject: string, body: string, sender: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY is not set. Using mock analysis.');
    return {
      category: 'Support',
      priority: body.toLowerCase().includes('urgent') ? 'High' : 'Medium',
      sentiment: 'Neutral',
      suggestedReply: 'Thank you for reaching out. Our team is looking into this and will get back to you shortly.',
      confidenceScore: 0.85,
      department: 'Customer Success'
    };
  }

  const prompt = `
    Analyze the following email and categorize it.
    Return ONLY valid JSON matching this schema exactly. No markdown code blocks, just raw JSON.
    {
      "category": "Support, Sales, Finance, HR, Technical, Complaint, Marketing, Security, Recruitment, Billing, Legal, or Spam",
      "priority": "Critical, High, Medium, or Low",
      "sentiment": "Angry, Frustrated, Neutral, Happy, or Urgent",
      "suggestedReply": "A professional, helpful, and concise suggested reply",
      "confidenceScore": 0.95,
      "department": "Suggested department"
    }
    
    Sender: ${sender}
    Subject: ${subject}
    Body:
    ${body}
  `;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Riya-PersonaEma'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    const data = await res.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message.content) {
      // Clean up markdown if the model hallucinates it despite the response_format
      let content = data.choices[0].message.content.trim();
      if (content.startsWith('\`\`\`json')) {
        content = content.substring(7);
      }
      if (content.startsWith('\`\`\`')) {
        content = content.substring(3);
      }
      if (content.endsWith('\`\`\`')) {
        content = content.substring(0, content.length - 3);
      }
      return JSON.parse(content);
    }
    
    console.error("OpenRouter Response Error:", JSON.stringify(data, null, 2));
    throw new Error('Invalid response from OpenRouter');
  } catch (error) {
    console.error('Error analyzing email with OpenRouter:', error);
    return {
      category: 'Unclassified',
      priority: 'Medium',
      sentiment: 'Unknown',
      suggestedReply: '',
      confidenceScore: 0.0,
      department: 'General'
    };
  }
}
