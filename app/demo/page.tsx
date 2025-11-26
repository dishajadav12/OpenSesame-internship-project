'use client'

import { JSX, useMemo, useState } from "react";

type Lang = "English" | "Spanish" | "French" | "German" | "Portuguese" | "Japanese";

function inlineMd(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function Markdown({ md }: { md: string }) {
  const lines = md.trim().split(/\r?\n/);
  const elements: JSX.Element[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flushList = () => {
    if (list.length) {
      elements.push(
        <ul className="list-disc pl-6" key={`ul-${elements.length}`}>
          {list.map((it, i) => (
            <li key={`li-${i}`} dangerouslySetInnerHTML={{ __html: inlineMd(it) }} />
          ))}
        </ul>
      );
      list = [];
    }
  };
  const flushPara = () => {
    if (para.length) {
      elements.push(
        <p className="mb-3" key={`p-${elements.length}`} dangerouslySetInnerHTML={{ __html: inlineMd(para.join(" ")) }} />
      );
      para = [];
    }
  };
  for (const line of lines) {
    if (/^###\s+/.test(line)) {
      flushList();
      flushPara();
      elements.push(<h3 className="text-lg font-semibold mt-4 mb-2" key={`h3-${elements.length}`}>{line.replace(/^###\s+/, "")}</h3>);
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushList();
      flushPara();
      elements.push(<h2 className="text-xl font-bold mt-5 mb-3" key={`h2-${elements.length}`}>{line.replace(/^##\s+/, "")}</h2>);
      continue;
    }
    if (/^#\s+/.test(line)) {
      flushList();
      flushPara();
      elements.push(<h1 className="text-2xl font-bold mt-6 mb-4" key={`h1-${elements.length}`}>{line.replace(/^#\s+/, "")}</h1>);
      continue;
    }
    if (/^-\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^-\s+/, ""));
      continue;
    }
    if (line.trim() === "") {
      flushList();
      flushPara();
      continue;
    }
    para.push(line.trim());
  }
  flushList();
  flushPara();
  return <div>{elements}</div>;
}

interface Week {
  week: number;
  theme: string;
  items: string[];
  task: string;
}

interface LearningPath {
  skills: string[];
  weeks: Week[];
  accessibility: string;
  assessment: string;
  localization: string;
}

export default function DemoPage() {
  const [role, setRole] = useState("Front-End Engineer (early-career)");
  const [goal, setGoal] = useState("Become proficient in TypeScript, accessibility (WCAG), and testing; ship a feature end-to-end.");
  const [hours, setHours] = useState<number>(4);
  const [language, setLanguage] = useState<Lang>("English");
  const [useLocalKey, setUseLocalKey] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [parsedPath, setParsedPath] = useState<LearningPath | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [lastPrompt, setLastPrompt] = useState("");
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);

  const prompt = useMemo(() => {
    return (
      "You are an instructional design assistant for a corporate learning marketplace.\n" +
      "Company: OpenSesame (AI-powered catalog; skills-based curation; multilingual content).\n" +
      `Audience: ${role}.\n` +
      `Learner’s goal: ${goal}.\n` +
      `Available time: ~${hours} hours/week.\n` +
      `Output language: ${language}.\n\n` +
      "TASK: Create a 4-week learning path. Return ONLY plain Markdown (NO code blocks, NO ```markdown tags).\n\n" +
      "Format EXACTLY like this:\n\n" +
      "## Top Skills\n" +
      "1. Skill Name: Brief description\n" +
      "2. Skill Name: Brief description\n" +
      "(Continue for 6 skills)\n\n" +
      "## Learning Path\n\n" +
      "**Week 1: Theme Title**\n" +
      "- Learning Item: Description\n" +
      "- Learning Item: Description\n" +
      "- Learning Item: Description\n" +
      "- Hands-on Task: Task description\n\n" +
      "**Week 2: Theme Title**\n" +
      "- Learning Item: Description\n" +
      "- Learning Item: Description\n" +
      "- Learning Item: Description\n" +
      "- Hands-on Task: Task description\n\n" +
      "(Continue for weeks 3-4)\n\n" +
      "## Accessibility\n" +
      "- Key accessibility considerations\n\n" +
      "## Assessment\n" +
      "- Scenario-based questions and rubric\n\n" +
      "## Localization\n" +
      `- Tips for ${language} localization\n\n` +
      "Keep it concrete, action-oriented, and workplace-relevant. DO NOT wrap output in code blocks."
    );
  }, [role, goal, hours, language]);

  const onGenerate = async () => {
    setError("");
    setResult("");
    setParsedPath(null);
    setActiveStep(0);
    setSavedPlanId(null);
    setLastPrompt(prompt);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          model: "gemini-2.0-flash", 
          generationConfig: { temperature: 0.6, topK: 32, topP: 0.95, maxOutputTokens: 2048 } 
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        if (data.code === "MISSING_ENV") {
          throw new Error("Server key missing. Add GEMINI_API_KEY to .env.local");
        }
        throw new Error(data.message || data.error || "Failed to generate content");
      }
      
      const data = await res.json();
      const text = data?.text || "";
      const plan = data?.plan;
      
      console.log('API Response:', { text: text.substring(0, 200), plan });
      
      setResult(text);
      
      if (plan && plan.weeks && plan.weeks.length > 0) {
        // Save to MongoDB and get the plan ID
        try {
          const saveRes = await fetch("/api/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role,
              goal,
              hours,
              language,
              skills: plan.skills || [],
              weeks: plan.weeks,
              accessibility: plan.accessibility || "",
              assessment: plan.assessment || "",
              localization: plan.localization || ""
            })
          });
          
          if (saveRes.ok) {
            const saveData = await saveRes.json();
            const planId = saveData.planId;
            setSavedPlanId(planId);
            
            // Fetch the saved plan from MongoDB
            const fetchRes = await fetch(`/api/plans/${planId}`);
            if (fetchRes.ok) {
              const fetchData = await fetchRes.json();
              setParsedPath(fetchData.plan);
            } else {
              // Fallback to the generated plan if fetch fails
              setParsedPath(plan);
            }
          } else {
            // If save fails, still display the generated plan
            setParsedPath(plan);
          }
        } catch (saveErr) {
          console.error("Failed to save/fetch plan:", saveErr);
          // Fallback to displaying the generated plan
          setParsedPath(plan);
        }
      }
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(lastPrompt || prompt);
    } catch {}
  };

  return (
    <main className="px-4 py-12">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">AI-Powered Learning Path Generator</h2>
      <p className="text-sm text-gray-600 mb-6">Tell us about your learning goals, and our AI will create a personalized 4-week learning journey just for you.</p>
      <form onSubmit={(e) => { e.preventDefault(); onGenerate(); }} className="space-y-4 max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value as Lang)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Learning goal</label>
          <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hours per week</label>
            <input type="number" min={1} max={40} value={hours} onChange={(e) => setHours(Number(e.target.value || 0))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
        {/* <div className="bg-white/80 rounded-lg p-3 ring-1 ring-indigo-200">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={useLocalKey} onChange={(e) => setUseLocalKey(e.target.checked)} />
            <span>Use local key (client-side call, not secure)</span>
          </label>
          {useLocalKey && (
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Gemini API Key</label>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste your API key" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
        </div> */}
        <div className="flex items-center gap-3 pt-2">
          <button type="button" onClick={onGenerate} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow hover:bg-orange-700 disabled:opacity-60">{loading ? "Generating…" : "Generate Plan"}</button>
          <button type="button" onClick={copyPrompt} className="rounded-lg bg-white text-orange-700 ring-1 ring-orange-200 px-3 py-2 text-sm font-medium hover:bg-orange-50">Copy Prompt</button>
          {savedPlanId && <span className="text-xs text-green-600 font-medium">✓ Saved to database</span>}
        </div>
        {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
      </form>
      {parsedPath && parsedPath.weeks.length > 0 && (
        <section className="mt-8 w-full">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-4">Your Learning Journey</h3>
            <div className="flex items-center gap-2 mb-6">
              {parsedPath.weeks.map((week, idx) => (
                <div key={week.week} className="flex items-center flex-1">
                  <button
                    onClick={() => setActiveStep(idx)}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      idx === activeStep ? 'bg-orange-600' : idx < activeStep ? 'bg-orange-400' : 'bg-gray-200'
                    }`}
                  />
                  {idx < parsedPath.weeks.length - 1 && <div className="w-2" />}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {parsedPath.weeks.map((week, idx) => (
              <div
                key={week.week}
                className={`bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-6 transition-all cursor-pointer ${
                  activeStep === idx ? 'ring-2 ring-orange-500 shadow-xl' : 'hover:shadow-xl'
                }`}
                onClick={() => setActiveStep(idx)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1 md-w-12 md-h-12 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-xs md-text-xl font-bold text-orange-600">{week.week}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{week.theme}</h4>
                    <ul className="space-y-1.5 mb-3">
                      {week.items.slice(0, 3).map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {week.task && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-orange-600 mb-1">HANDS-ON TASK</p>
                        <p className="text-sm text-gray-700">{week.task}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(parsedPath.accessibility || parsedPath.assessment || parsedPath.localization) && (
            <div className="space-y-4 gap-4">
              {parsedPath.accessibility && (
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg shadow p-5 ring-1 ring-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">♿</span>
                    </div>
                    <h5 className="font-semibold text-gray-900">Accessibility</h5>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{parsedPath.accessibility}</p>
                </div>
              )}
              {parsedPath.assessment && (
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow p-5 ring-1 ring-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">✓</span>
                    </div>
                    <h5 className="font-semibold text-gray-900">Assessment</h5>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{parsedPath.assessment}</p>
                </div>
              )}
              {parsedPath.localization && (
                <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow p-5 ring-1 ring-green-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">🌐</span>
                    </div>
                    <h5 className="font-semibold text-gray-900">Localization</h5>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{parsedPath.localization}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {result && !parsedPath && (
        <section className="mt-8 max-w-4xl">
          <div className="bg-white/90 rounded-2xl shadow ring-1 ring-black/5 p-6 ">
Your learning path...          </div>
        </section>
      )}

      {!result && !loading && !error && (
        <section className="mt-8 max-w-4xl">
          <div className="bg-white/90 rounded-2xl shadow ring-1 ring-black/5 p-6 ">
            <p className="text-sm text-gray-600">Your learning path will appear here after you click "Generate Plan".</p>
          </div>
        </section>
      )}
    </main>
  );
}

