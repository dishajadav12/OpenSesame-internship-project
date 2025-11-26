import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';

const allowedModels = new Set(["gemini-2.0-flash", "gemini-2.5-pro", "gemini-flash-latest", "gemini-pro-latest"]);
const rateStore: Record<string, { count: number; windowStart: number }> = {};

interface Week {
  week: number;
  theme: string;
  items: string[];
  task: string;
}

interface ParsedPlan {
  skills: string[];
  weeks: Week[];
  accessibility: string;
  assessment: string;
  localization: string;
}

function parseMarkdownToJSON(md: string): ParsedPlan {
  // Remove code block markers if present - handle various formats
  let cleanMd = md
    .replace(/^```(?:markdown|md)?\s*\n?/i, '')
    .replace(/\n?```\s*$/g, '')
    .trim();
  
  console.log('=== PARSING MARKDOWN ===');
  console.log('Full text length:', cleanMd.length);
  console.log('First 800 chars:', cleanMd.substring(0, 800));
  
  const lines = cleanMd.split('\n');
  const skills: string[] = [];
  const weeks: Week[] = [];
  let accessibility = '';
  let assessment = '';
  let localization = '';
  
  let currentSection = '';
  let currentWeek: Partial<Week> | null = null;
  let currentItems: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) continue;
    
    // Detect main sections with more flexible patterns
    if (trimmed.match(/^#{1,4}\s*(Top\s*\d*\s*Skills?|Skills?[\s\/]*(Competencies)?|Key\s*Skills?)/i)) {
      currentSection = 'skills';
      continue;
    }
    if (trimmed.match(/^#{1,4}\s*(Learning\s*Path|4-Week\s*Plan|Weekly\s*Breakdown)/i)) {
      currentSection = 'weeks';
      continue;
    }
    if (trimmed.match(/^#{1,4}\s*Accessibility/i)) {
      currentSection = 'accessibility';
      continue;
    }
    if (trimmed.match(/^#{1,4}\s*Assessment/i)) {
      currentSection = 'assessment';
      continue;
    }
    if (trimmed.match(/^#{1,4}\s*Localization/i)) {
      currentSection = 'localization';
      continue;
    }
    
    // Parse skills section - more flexible patterns
    if (currentSection === 'skills') {
      // Match: "1. **Skill**: description" or "1. Skill: description" or "- Skill: description"
      const skillMatch = trimmed.match(/^(?:\d+\.|\-|\*)\s*\*{0,2}([^:*]+?)\*{0,2}:\s*(.+)/);
      if (skillMatch) {
        const skillName = skillMatch[1].trim();
        const skillDesc = skillMatch[2].trim();
        skills.push(`${skillName}: ${skillDesc}`);
        continue;
      }
    }
    
    // Parse weeks section with more flexible patterns
    if (currentSection === 'weeks') {
      // Match week headers: "Week 1:", "**Week 1:**", "### Week 1:", etc.
      const weekMatch = trimmed.match(/^(?:#{1,4}\s*)?\*{0,2}Week\s*(\d+)[:\s-]*(.+?)?\*{0,2}$/i);
      if (weekMatch) {
        // Save previous week
        if (currentWeek && currentWeek.week !== undefined) {
          weeks.push({ ...currentWeek, items: currentItems, task: currentWeek.task || '' } as Week);
        }
        currentWeek = {
          week: parseInt(weekMatch[1]),
          theme: weekMatch[2] ? weekMatch[2].replace(/\*+/g, '').trim() : '',
          task: ''
        };
        currentItems = [];
        continue;
      }
      
      // Match theme lines that might come after week number
      if (currentWeek && !currentWeek.theme && trimmed.match(/^(?:Theme|Focus)[:\s]/i)) {
        currentWeek.theme = trimmed.replace(/^(?:Theme|Focus)[:\s]*/i, '').replace(/\*+/g, '').trim();
        continue;
      }
      
      // If we just have a bold line after a week number, use it as theme
      if (currentWeek && !currentWeek.theme && trimmed.match(/^\*\*[^*]+\*\*$/)) {
        currentWeek.theme = trimmed.replace(/\*+/g, '').trim();
        continue;
      }
      
      if (currentWeek) {
        // Match hands-on task with various formats
        if (trimmed.match(/^(?:[\*\-•]\s*)?(?:\*\*)?Hands?-?[oO]n\s*Task:?/i)) {
          currentWeek.task = trimmed.replace(/^(?:[\*\-•]\s*)?(?:\*\*)?Hands?-?[oO]n\s*Task:?\*{0,2}\s*/i, '').replace(/\*+/g, '').trim();
          continue;
        }
        
        // Match microlearning items with more flexible patterns
        // Pattern: "- **Title**: Description" or "- Title: Description" or just "- Description"
        if (trimmed.match(/^[\*\-•]\s+/)) {
          const itemText = trimmed.replace(/^[\*\-•]\s+/, '').trim();
          
          // Remove quotes if present: "Title": Description
          const quotedMatch = itemText.match(/^[""](.+?)[""]:\s*(.+)/);
          if (quotedMatch) {
            currentItems.push(`${quotedMatch[1]}: ${quotedMatch[2]}`);
            continue;
          }
          
          // Match **Title**: Description
          const boldMatch = itemText.match(/^\*\*(.+?)\*\*:\s*(.+)/);
          if (boldMatch) {
            currentItems.push(`${boldMatch[1]}: ${boldMatch[2]}`);
            continue;
          }
          
          // Match Title: Description
          const colonMatch = itemText.match(/^([^:]+):\s*(.+)/);
          if (colonMatch && colonMatch[1].length < 80) {
            currentItems.push(`${colonMatch[1]}: ${colonMatch[2]}`);
            continue;
          }
          
          // Just use the whole line if no colon
          if (itemText && !itemText.match(/Hands?-?[oO]n/i)) {
            currentItems.push(itemText.replace(/\*+/g, ''));
          }
        }
      }
    }
    
    // Collect accessibility, assessment, localization content
    if (currentSection === 'accessibility') {
      if (trimmed.match(/^[\*\-•]\s+/)) {
        const text = trimmed.replace(/^[\*\-•]\s+/, '').replace(/\*+/g, '');
        accessibility += (accessibility ? ' ' : '') + text;
      } else if (!trimmed.match(/^#{1,4}/)) {
        accessibility += (accessibility ? ' ' : '') + trimmed.replace(/\*+/g, '');
      }
    }
    
    if (currentSection === 'assessment') {
      if (trimmed.match(/^[\*\-•]\s+/) || trimmed.match(/^Scenario/i)) {
        const text = trimmed.replace(/^[\*\-•]\s+/, '').replace(/\*+/g, '');
        assessment += (assessment ? ' ' : '') + text;
      } else if (!trimmed.match(/^#{1,4}/)) {
        assessment += (assessment ? ' ' : '') + trimmed.replace(/\*+/g, '');
      }
    }
    
    if (currentSection === 'localization') {
      if (trimmed.match(/^[\*\-•]\s+/)) {
        const text = trimmed.replace(/^[\*\-•]\s+/, '').replace(/\*+/g, '');
        localization += (localization ? ' ' : '') + text;
      } else if (!trimmed.match(/^#{1,4}/)) {
        localization += (localization ? ' ' : '') + trimmed.replace(/\*+/g, '');
      }
    }
  }
  
  // Save last week
  if (currentWeek && currentWeek.week !== undefined) {
    weeks.push({ ...currentWeek, items: currentItems, task: currentWeek.task || '' } as Week);
  }
  
  console.log('=== PARSING RESULTS ===');
  console.log('Skills found:', skills.length);
  console.log('Weeks found:', weeks.length);
  weeks.forEach(w => {
    console.log(`Week ${w.week}: "${w.theme}", Items: ${w.items.length}, Task: "${w.task?.substring(0, 50) || 'none'}..."`);
    console.log('  Items:', w.items);
  });
  
  return {
    skills,
    weeks,
    accessibility: accessibility.trim(),
    assessment: assessment.trim(),
    localization: localization.trim()
  };
}

function cors(origin: string | null) {
  const allowed = process.env.CORS_ORIGIN || "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (allowed && origin && origin === allowed) headers["Access-Control-Allow-Origin"] = allowed;
  return headers;
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    
    // Rate limiting
    const now = Date.now();
    const windowMs = 60_000;
    const limit = 10;
    const bucket = rateStore[ip] || { count: 0, windowStart: now };
    
    if (now - bucket.windowStart >= windowMs) {
      bucket.count = 0;
      bucket.windowStart = now;
    }
    bucket.count += 1;
    rateStore[ip] = bucket;
    
    if (bucket.count > limit) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many requests. Please try again later." }, 
        { status: 429, headers: cors(origin) }
      );
    }

    // Parse request body
    let bodyObj: any;
    try {
      const txt = await req.text();
      bodyObj = JSON.parse(txt);
    } catch {
      return NextResponse.json(
        { code: "BAD_JSON", message: "Invalid JSON body." }, 
        { status: 400, headers: cors(origin) }
      );
    }

    const prompt = typeof bodyObj?.prompt === "string" ? bodyObj.prompt : "";
    if (!prompt.trim()) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Missing 'prompt' field." }, 
        { status: 400, headers: cors(origin) }
      );
    }

    // Check API key
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json(
        { code: "MISSING_ENV", message: "Server API key not configured." }, 
        { status: 500, headers: cors(origin) }
      );
    }

    // Determine model
    let urlModelParam: string | null = null;
    try {
      urlModelParam = new URL(req.url).searchParams.get("model");
    } catch {
      urlModelParam = null;
    }
    
    const requestedModel = (bodyObj?.model as string) || urlModelParam || "gemini-2.0-flash";
    if (!allowedModels.has(requestedModel)) {
      return NextResponse.json(
        { code: "UNSUPPORTED_MODEL", message: `Model ${requestedModel} is not supported.` }, 
        { status: 400, headers: cors(origin) }
      );
    }

    // Build generation config
    const gen = bodyObj?.generationConfig || {};
    const generationConfig = {
      temperature: typeof gen.temperature === "number" ? gen.temperature : 0.6,
      topK: typeof gen.topK === "number" ? gen.topK : 32,
      topP: typeof gen.topP === "number" ? gen.topP : 0.95,
      maxOutputTokens: typeof gen.maxOutputTokens === "number" ? gen.maxOutputTokens : 1200
    };

    // Make API call to Google Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${requestedModel}:generateContent?key=${key}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to generate content";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      
      return NextResponse.json(
        { code: "UPSTREAM_ERROR", message: errorMessage, status: response.status }, 
        { status: response.status, headers: cors(origin) }
      );
    }

    const data = await response.json();
    
    // Extract text from response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const candidates = data.candidates || [];

    // Parse markdown to JSON
    const parsedPlan = parseMarkdownToJSON(text);

    return NextResponse.json(
      { candidates, text, plan: parsedPlan }, 
      { status: 200, headers: cors(origin) }
    );

  } catch (err: any) {
    const rid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    console.error("Internal error:", err);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: String(err?.message || err), requestId: rid }, 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

