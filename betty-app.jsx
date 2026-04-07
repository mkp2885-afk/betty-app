import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#F0F7F4",
  header: "#B8E4D8",
  pink: "#F4B8CC",
  blue: "#B8D4F4",
  green: "#B8E4C8",
  tabActive: "#EE85AA",
  tabBg: "#D4EEE8",
  border: "#D0E8E0",
  text: "#2D4A42",
  textMuted: "#7AA090",
  btnPink: "#EE85AA",
  btnBlue: "#7AB8E8",
  userBubble: "#C8E8F8",
  bettyBubble: "#F8E4EE",
  yellow: "#FFF0B8",
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const GREETINGS = [
  "okay bestie, what are we saving today? 🍳",
  "back again? betty's ready when you are ✨",
  "let's get this bread. literally. what do you need?",
];

const SAVING_MSGS = [
  "ooh this one looks actually good. saving it for you 📌",
  "got it. betty approved (mostly). saved ✓",
  "another pasta? no judgment. saved 🍝",
];

const DIETARY_OPTIONS = ["🥩 Meat lover", "🌱 Vegetarian", "🌿 Vegan", "🐟 Pescatarian", "🌾 Gluten-free", "🥛 Dairy-free"];

const SAMPLE_RECIPES = [
  { id: 1, title: "Brown Butter Pasta", time: "20 min", tags: ["quick", "pasta"], img: "🍝", betty: "this one is genuinely elite. make it.", steps: ["Boil salted pasta water", "Brown 4 tbsp butter until nutty and golden", "Cook pasta al dente, reserve 1 cup pasta water", "Toss pasta in brown butter, add pasta water gradually", "Finish with parmesan and black pepper"] },
  { id: 2, title: "Smash Burgers", time: "15 min", tags: ["weekend", "meat"], img: "🍔", betty: "saved 6 days ago. still waiting bestie 👀", steps: ["Form loose 80g beef balls — don't overwork the meat", "Heat cast iron until smoking", "Smash balls flat with a spatula, hard", "Season with salt, cook 2 min until edges crisp", "Flip, add cheese, cook 1 min", "Stack and serve immediately"] },
  { id: 3, title: "Miso Glazed Salmon", time: "25 min", tags: ["healthy", "fish"], img: "🐟", betty: "new save! betty approves this one hard.", steps: ["Mix 2 tbsp white miso, 1 tbsp mirin, 1 tbsp soy", "Coat salmon and marinate 10 minutes", "Set oven to broil on high", "Broil 8 min until glaze caramelises", "Serve with rice and greens"] },
  { id: 4, title: "Grandma's Tiramisu", time: "45 min", tags: ["dessert", "italian"], img: "☕", betty: "this came from a handwritten card. iconic.", steps: ["Whisk 4 egg yolks with sugar until pale", "Fold in 250g mascarpone", "Brew strong espresso and cool", "Dip ladyfingers briefly — don't soak", "Layer: fingers, cream, fingers, cream", "Dust with cocoa, chill 4 hours"] },
];

const TABS = ["saved", "tonight", "cook", "betty"];

export default function BettyApp() {
  const [screen, setScreen] = useState("onboarding");
  const [onboardStep, setOnboardStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [dietary, setDietary] = useState([]);
  const [activeTab, setActiveTab] = useState("saved");
  const [bettyMsg, setBettyMsg] = useState(getRandom(GREETINGS));
  const [saveInput, setSaveInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedDone, setSavedDone] = useState(false);
  const [fridgeItems, setFridgeItems] = useState("");
  const [fridgeResult, setFridgeResult] = useState(null);
  const [fridgeLoading, setFridgeLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [cookStep, setCookStep] = useState(0);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState([]);
  const [shoppingChecked, setShoppingChecked] = useState({});
  const [showShopping, setShowShopping] = useState(false);
  const [bettyImageUrl, setBettyImageUrl] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    fetch("betty-face.png")
      .then(r => r.blob())
      .then(blob => setBettyImageUrl(URL.createObjectURL(blob)))
      .catch(() => setBettyImageUrl(null));
  }, []);

  const BettyFace = ({ size = 48, style: extraStyle = {} }) => (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      overflow: "hidden",
      flexShrink: 0,
      border: `2.5px solid ${C.pink}`,
      background: C.bettyBubble,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 10px rgba(244,184,204,0.4)",
      fontSize: size * 0.5,
      ...extraStyle,
    }}>
      {bettyImageUrl
        ? <img src={bettyImageUrl} alt="Betty" style={{ width: "145%", height: "145%", objectFit: "cover", objectPosition: "top center", marginTop: "12%" }} />
        : "👩‍🍳"
      }
    </div>
  );

  const BETTY_SYSTEM = `You are Betty, a witty, warm, slightly sassy AI cooking assistant for a Gen Z recipe app. You speak casually, use occasional emojis, have strong opinions about food. IMPORTANT: Always respond in whatever language the user writes in — if they write in French reply in French, Spanish reply in Spanish, etc. Be short, punchy, funny. Always on the user's side.${dietary.length ? ` User dietary preferences: ${dietary.join(", ")}.` : ""}${userName ? ` User's name is ${userName}.` : ""}`;

  const handleSave = async () => {
    if (!saveInput.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1800));
    setSaving(false);
    setSavedDone(true);
    setBettyMsg(getRandom(SAVING_MSGS));
    setSaveInput("");
    setTimeout(() => setSavedDone(false), 3000);
  };

  const handleFridge = async () => {
    if (!fridgeItems.trim()) return;
    setFridgeLoading(true);
    setFridgeResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: BETTY_SYSTEM + ` Suggest 2-3 recipes from fridge ingredients. Return ONLY valid JSON: {"message": "betty's take", "recipes": [{"name": "Name", "emoji": "🍳", "why": "one line", "time": "X min"}]}`,
          messages: [{ role: "user", content: `I have: ${fridgeItems}. What can I make tonight?` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((c) => c.text || "").join("") || "";
      const parsed = JSON.parse(text);
      setFridgeResult(parsed);
      setBettyMsg(parsed.message);
    } catch {
      setFridgeResult({ message: "betty's brain glitched. try again bestie.", recipes: [] });
    }
    setFridgeLoading(false);
  };

  const handleChat = async () => {
    if (!chatMsg.trim() || chatLoading) return;
    const userMsg = chatMsg;
    setChatMsg("");
    const newHistory = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);
    setChatLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: BETTY_SYSTEM + (selectedRecipe ? ` Currently helping cook: "${selectedRecipe.title}".` : " Help with any food question."),
          messages: newHistory,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map((c) => c.text || "").join("") || "betty's stumped. try again?";
      setChatHistory([...newHistory, { role: "assistant", content: reply }]);
    } catch {
      setChatHistory([...newHistory, { role: "assistant", content: "betty's wifi is being dramatic 😤 try again?" }]);
    }
    setChatLoading(false);
  };

  const addToShopping = (recipe) => {
    const ingredients = {
      1: ["pasta 400g", "butter 4 tbsp", "parmesan", "black pepper"],
      2: ["beef mince 400g", "burger buns", "cheddar slices", "salt"],
      3: ["salmon 2 fillets", "white miso 2 tbsp", "mirin 1 tbsp", "soy sauce 1 tbsp"],
      4: ["eggs 4", "mascarpone 250g", "ladyfingers", "espresso 200ml", "cocoa powder"],
    };
    setShoppingList((prev) => [...new Set([...prev, ...(ingredients[recipe.id] || [])])]);
    setShowShopping(true);
  };

  const cardAccents = [C.blue, C.pink, C.green, C.yellow];

  // ─── ONBOARDING ───────────────────────────────────────────────
  if (screen === "onboarding") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "Georgia, serif", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "390px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

          <div style={{ height: 220, background: `linear-gradient(135deg, ${C.header}, #C8EEE0)`, position: "relative", overflow: "hidden", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: C.pink, borderRadius: "50%", opacity: 0.45 }} />
            <div style={{ position: "absolute", top: 30, right: 70, width: 70, height: 70, background: C.blue, borderRadius: "50%", opacity: 0.4 }} />
            <div style={{ position: "absolute", bottom: -20, left: -20, width: 90, height: 90, background: C.pink, borderRadius: "50%", opacity: 0.3 }} />

            {/* Big Betty illustration */}
            <div style={{ position: "absolute", right: 16, bottom: 0, width: 140, height: 200, overflow: "hidden" }}>
              {bettyImageUrl
                ? <img src={bettyImageUrl} alt="Betty" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
                : <div style={{ fontSize: 80, textAlign: "center", paddingTop: 40 }}>👩‍🍳</div>
              }
            </div>

            <div style={{ position: "absolute", bottom: 24, left: 24 }}>
              <div style={{ fontSize: 38, fontWeight: "bold", color: C.text, letterSpacing: "-1.5px", lineHeight: 1 }}>betty.</div>
              <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>your recipe bestie</div>
            </div>
          </div>

          <div style={{ flex: 1, padding: "32px 24px", display: "flex", flexDirection: "column" }}>
            {onboardStep === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 22, fontWeight: "bold", color: C.text, marginBottom: 8 }}>hey, I'm betty 👋</div>
                <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 32, lineHeight: 1.6 }}>your AI cooking bestie. I save recipes, suggest dinners, and help you actually cook them. first — what should I call you?</div>
                <input value={userName} onChange={(e) => setUserName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && userName.trim() && setOnboardStep(1)} placeholder="your name..." style={{ padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: "Georgia, serif", background: "#fff", outline: "none", color: C.text, marginBottom: 16 }} />
                <button onClick={() => userName.trim() && setOnboardStep(1)} style={{ padding: "14px", background: `linear-gradient(135deg, ${C.btnPink}, ${C.btnBlue})`, color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: "bold", fontFamily: "Georgia, serif", cursor: "pointer", boxShadow: "0 4px 14px rgba(122,184,232,0.3)" }}>
                  nice to meet you →
                </button>
              </div>
            )}

            {onboardStep === 1 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 22, fontWeight: "bold", color: C.text, marginBottom: 8 }}>hey {userName}! 🌸</div>
                <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 24, lineHeight: 1.6 }}>any dietary preferences? betty will keep them in mind for every recipe.</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
                  {DIETARY_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => setDietary((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt])} style={{ padding: "10px 16px", borderRadius: 24, border: `1.5px solid ${dietary.includes(opt) ? C.btnPink : C.border}`, background: dietary.includes(opt) ? C.pink : "#fff", color: dietary.includes(opt) ? C.text : C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "Georgia, serif", transition: "all 0.15s" }}>{opt}</button>
                  ))}
                </div>
                <button onClick={() => { setBettyMsg(`welcome${userName ? `, ${userName}` : ""}! let's cook something good 🍳`); setScreen("main"); }} style={{ padding: "14px", background: `linear-gradient(135deg, ${C.btnPink}, ${C.btnBlue})`, color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: "bold", fontFamily: "Georgia, serif", cursor: "pointer", boxShadow: "0 4px 14px rgba(122,184,232,0.3)" }}>
                  {dietary.length ? "let's go! →" : "skip for now →"}
                </button>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              {[0, 1].map((i) => (
                <div key={i} style={{ width: i === onboardStep ? 20 : 8, height: 8, borderRadius: 4, background: i === onboardStep ? C.btnPink : C.border, transition: "width 0.3s" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN APP ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "Georgia, serif", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "390px", minHeight: "100vh", background: C.bg, position: "relative" }}>

        {/* Shopping overlay */}
        {showShopping && (
          <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: 390, height: "100vh", background: "rgba(45,74,66,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", background: "#fff", borderRadius: "24px 24px 0 0", padding: 24, maxHeight: "70vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontWeight: "bold", fontSize: 18, color: C.text }}>🛒 Shopping List</div>
                <button onClick={() => setShowShopping(false)} style={{ background: C.bg, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: C.textMuted, fontSize: 13 }}>done</button>
              </div>
              {shoppingList.length === 0 && <div style={{ color: C.textMuted, fontStyle: "italic", fontSize: 14 }}>no items yet — tap "add to list" on any recipe</div>}
              {shoppingList.map((item, i) => (
                <div key={i} onClick={() => setShoppingChecked((p) => ({ ...p, [item]: !p[item] }))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${shoppingChecked[item] ? C.btnPink : C.border}`, background: shoppingChecked[item] ? C.pink : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                    {shoppingChecked[item] ? "✓" : ""}
                  </div>
                  <div style={{ fontSize: 14, color: C.text, textDecoration: shoppingChecked[item] ? "line-through" : "none", opacity: shoppingChecked[item] ? 0.5 : 1 }}>{item}</div>
                </div>
              ))}
              {shoppingList.length > 0 && <button onClick={() => { setShoppingList([]); setShoppingChecked({}); }} style={{ marginTop: 16, width: "100%", padding: "12px", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, color: C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "Georgia, serif" }}>clear list</button>}
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.header} 0%, #C8EEE0 100%)`, padding: "48px 24px 20px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, background: C.pink, borderRadius: "50%", opacity: 0.45 }} />
          <div style={{ position: "absolute", top: 25, right: 65, width: 55, height: 55, background: C.blue, borderRadius: "50%", opacity: 0.4 }} />
          <div style={{ position: "absolute", bottom: -20, left: -15, width: 75, height: 75, background: C.pink, borderRadius: "50%", opacity: 0.3 }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <BettyFace size={54} />
              <div>
                <div style={{ fontSize: 30, fontWeight: "bold", color: C.text, letterSpacing: "-1px", lineHeight: 1 }}>betty.</div>
                <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 2 }}>
                  {userName ? `hi ${userName} 🌸` : "your recipe bestie"}
                </div>
              </div>
            </div>
            <button onClick={() => setShowShopping(true)} style={{ background: "rgba(255,255,255,0.7)", border: "none", borderRadius: 12, padding: "8px 12px", cursor: "pointer", fontSize: 20, position: "relative" }}>
              🛒
              {shoppingList.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: C.btnPink, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>{shoppingList.length}</span>}
            </button>
          </div>

          <div style={{ marginTop: 14, display: "flex", alignItems: "flex-end", gap: 8 }}>
            <BettyFace size={30} />
            <div style={{ background: "#fff", borderRadius: "16px 16px 16px 4px", padding: "10px 16px", fontSize: 13, color: C.text, fontStyle: "italic", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", maxWidth: "80%" }}>
              "{bettyMsg}"
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: C.tabBg }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "11px 0", background: activeTab === tab ? C.tabActive : "transparent", border: "none", cursor: "pointer", fontSize: 10, fontWeight: "bold", color: activeTab === tab ? "#fff" : C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "Georgia, serif", transition: "all 0.2s", borderRadius: activeTab === tab ? "8px 8px 0 0" : 0 }}>
              {tab === "betty" ? "ask betty" : tab === "cook" ? "👨‍🍳 cook" : tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "20px 20px 100px" }}>

          {/* SAVED TAB */}
          {activeTab === "saved" && (
            <div>
              <div style={{ background: "#fff", borderRadius: 20, padding: 16, marginBottom: 20, boxShadow: "0 4px 16px rgba(180,220,200,0.25)", border: `1.5px solid ${C.border}` }}>
                <div style={{ fontSize: 11, fontWeight: "bold", color: C.btnPink, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>✨ Save a recipe</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={saveInput} onChange={(e) => setSaveInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} placeholder="paste URL, describe it, or snap a photo..." style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 13, fontFamily: "Georgia, serif", background: C.bg, outline: "none", color: C.text }} />
                  <button onClick={handleSave} disabled={saving} style={{ padding: "10px 16px", background: saving ? "#ddd" : C.btnPink, color: "#fff", border: "none", borderRadius: 12, cursor: saving ? "default" : "pointer", fontSize: 16, boxShadow: saving ? "none" : "0 4px 10px rgba(238,133,170,0.35)" }}>
                    {saving ? "⏳" : savedDone ? "✓" : "➕"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["📸 Photo", "✍️ Handwritten", "🎬 Video"].map((opt) => (
                    <div key={opt} style={{ flex: 1, padding: "8px 6px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 11, color: C.textMuted, textAlign: "center", cursor: "pointer" }}>{opt}</div>
                  ))}
                </div>
                {saving && <div style={{ fontSize: 12, color: C.btnPink, marginTop: 8, fontStyle: "italic" }}>betty is reading it...</div>}
              </div>

              {dietary.length > 0 && (
                <div style={{ background: C.bettyBubble, borderRadius: 14, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
                  <BettyFace size={24} />
                  filtering for: <strong>{dietary.map(d => d.split(" ")[1]).join(", ")}</strong>
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: "bold", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Your cookbook ({SAMPLE_RECIPES.length})</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {SAMPLE_RECIPES.map((r, idx) => (
                  <div key={r.id} style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", boxShadow: "0 4px 14px rgba(180,220,200,0.18)", border: `1.5px solid ${C.border}` }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center", cursor: "pointer" }} onClick={() => { setSelectedRecipe(r); setCookStep(0); setActiveTab("cook"); setBettyMsg(`let's cook ${r.title}! 🍳`); }}>
                      <div style={{ width: 52, height: 52, background: cardAccents[idx % cardAccents.length], borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{r.img}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: "bold", fontSize: 15, color: C.text, marginBottom: 2 }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: C.btnPink, fontStyle: "italic", marginBottom: 6 }}>"{r.betty}"</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, background: C.blue, padding: "2px 10px", borderRadius: 20, color: C.text, fontWeight: "bold" }}>⏱ {r.time}</span>
                          {r.tags.map(t => <span key={t} style={{ fontSize: 11, background: C.bg, padding: "2px 10px", borderRadius: 20, color: C.textMuted, border: `1px solid ${C.border}` }}>{t}</span>)}
                        </div>
                      </div>
                      <div style={{ fontSize: 20, color: C.border }}>›</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button onClick={() => addToShopping(r)} style={{ flex: 1, padding: "8px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.textMuted, cursor: "pointer", fontFamily: "Georgia, serif" }}>🛒 add to list</button>
                      <button onClick={() => { setSelectedRecipe(r); setChatHistory([]); setActiveTab("betty"); setBettyMsg(`ask me anything about ${r.title} 🍳`); }} style={{ flex: 1, padding: "8px", background: C.bettyBubble, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.btnPink, cursor: "pointer", fontFamily: "Georgia, serif" }}>👩‍🍳 ask betty</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TONIGHT TAB */}
          {activeTab === "tonight" && (
            <div>
              <div style={{ background: "#fff", borderRadius: 20, padding: 18, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 16px rgba(180,220,200,0.2)", marginBottom: 16 }}>
                <div style={{ fontWeight: "bold", fontSize: 16, color: C.text, marginBottom: 4 }}>What's in your fridge? 🧊</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12, fontStyle: "italic" }}>tell betty in any language — she gets it</div>
                <textarea value={fridgeItems} onChange={(e) => setFridgeItems(e.target.value)} placeholder="eggs, leftover rice, some sad spinach..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 13, fontFamily: "Georgia, serif", background: C.bg, outline: "none", resize: "none", boxSizing: "border-box", color: C.text }} />
                <button onClick={handleFridge} disabled={fridgeLoading} style={{ marginTop: 10, width: "100%", padding: "13px", background: fridgeLoading ? "#ddd" : `linear-gradient(135deg, ${C.btnPink}, ${C.btnBlue})`, color: "#fff", border: "none", borderRadius: 12, cursor: fridgeLoading ? "default" : "pointer", fontSize: 14, fontWeight: "bold", fontFamily: "Georgia, serif", boxShadow: fridgeLoading ? "none" : "0 4px 14px rgba(122,184,232,0.3)" }}>
                  {fridgeLoading ? "betty is thinking... 🤔" : "ask betty what to make ✨"}
                </button>
              </div>
              {fridgeResult && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: "bold", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Betty's picks for tonight</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {fridgeResult.recipes?.map((r, i) => (
                      <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", border: `1.5px solid ${C.border}`, boxShadow: "0 4px 14px rgba(180,220,200,0.18)", display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 48, height: 48, background: [C.pink, C.blue, C.green][i % 3], borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{r.emoji}</div>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: 15, color: C.text }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", marginTop: 2 }}>{r.why}</div>
                          <div style={{ fontSize: 11, background: C.blue, display: "inline-block", padding: "2px 10px", borderRadius: 20, color: C.text, fontWeight: "bold", marginTop: 6 }}>⏱ {r.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COOK MODE TAB */}
          {activeTab === "cook" && (
            <div>
              {!selectedRecipe ? (
                <div style={{ background: "#fff", borderRadius: 18, padding: 24, border: `1.5px solid ${C.border}`, textAlign: "center" }}>
                  <BettyFace size={60} style={{ margin: "0 auto 16px" }} />
                  <div style={{ color: C.textMuted, fontStyle: "italic", fontSize: 14, lineHeight: 1.7 }}>
                    tap a recipe from your cookbook<br />to start cook mode 👨‍🍳
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.blue})`, borderRadius: 18, padding: 16, marginBottom: 20, boxShadow: "0 4px 14px rgba(180,220,200,0.25)" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>now cooking</div>
                    <div style={{ fontWeight: "bold", color: "#fff", fontSize: 20, marginBottom: 4 }}>{selectedRecipe.img} {selectedRecipe.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>step {cookStep + 1} of {selectedRecipe.steps.length}</div>
                    <div style={{ marginTop: 10, height: 6, background: "rgba(255,255,255,0.3)", borderRadius: 3 }}>
                      <div style={{ height: "100%", background: "#fff", borderRadius: 3, width: `${((cookStep + 1) / selectedRecipe.steps.length) * 100}%`, transition: "width 0.4s" }} />
                    </div>
                  </div>

                  <div style={{ background: "#fff", borderRadius: 18, padding: 20, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 14px rgba(180,220,200,0.18)", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: "bold", color: C.btnPink, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>step {cookStep + 1}</div>
                    <div style={{ fontSize: 17, color: C.text, lineHeight: 1.6, fontWeight: "bold" }}>{selectedRecipe.steps[cookStep]}</div>
                  </div>

                  <div style={{ background: "#fff", borderRadius: 18, padding: 16, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 14px rgba(180,220,200,0.18)", marginBottom: 16 }}>
                    {selectedRecipe.steps.map((step, i) => (
                      <div key={i} onClick={() => setCookStep(i)} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: i < selectedRecipe.steps.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", opacity: i < cookStep ? 0.4 : 1 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === cookStep ? C.btnPink : i < cookStep ? C.green : C.bg, border: `2px solid ${i === cookStep ? C.btnPink : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", color: i <= cookStep ? "#fff" : C.textMuted, flexShrink: 0 }}>
                          {i < cookStep ? "✓" : i + 1}
                        </div>
                        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, paddingTop: 3 }}>{step}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setCookStep((s) => Math.max(0, s - 1))} disabled={cookStep === 0} style={{ flex: 1, padding: "13px", background: cookStep === 0 ? "#ddd" : C.bg, border: `1.5px solid ${C.border}`, borderRadius: 14, fontSize: 14, color: cookStep === 0 ? "#bbb" : C.text, cursor: cookStep === 0 ? "default" : "pointer", fontFamily: "Georgia, serif" }}>← back</button>
                    <button onClick={() => { if (cookStep < selectedRecipe.steps.length - 1) { setCookStep((s) => s + 1); } else { setBettyMsg("you did it!! 🎉 how did it turn out?"); setSelectedRecipe(null); setActiveTab("betty"); } }} style={{ flex: 2, padding: "13px", background: `linear-gradient(135deg, ${C.btnPink}, ${C.btnBlue})`, border: "none", borderRadius: 14, fontSize: 14, fontWeight: "bold", color: "#fff", cursor: "pointer", fontFamily: "Georgia, serif", boxShadow: "0 4px 14px rgba(122,184,232,0.3)" }}>
                      {cookStep === selectedRecipe.steps.length - 1 ? "done! 🎉" : "next step →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ASK BETTY TAB */}
          {activeTab === "betty" && (
            <div>
              {selectedRecipe && (
                <div style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.blue})`, borderRadius: 18, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center", boxShadow: "0 4px 14px rgba(180,220,200,0.25)" }}>
                  <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.5)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{selectedRecipe.img}</div>
                  <div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>asking about</div>
                    <div style={{ fontWeight: "bold", color: "#fff", fontSize: 15 }}>{selectedRecipe.title}</div>
                  </div>
                  <button onClick={() => { setSelectedRecipe(null); setChatHistory([]); }} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.3)", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              )}

              {!selectedRecipe && chatHistory.length === 0 && (
                <div>
                  <div style={{ background: "#fff", borderRadius: 18, padding: 18, border: `1.5px solid ${C.border}`, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <BettyFace size={48} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: "bold", color: C.text }}>hey{userName ? ` ${userName}` : ""}! 👋</div>
                        <div style={{ fontSize: 13, color: C.textMuted, fontStyle: "italic" }}>ask me anything — I speak your language</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: "bold", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>try asking...</div>
                  {[
                    "what can I make with 3 eggs?",
                    "how do I know when oil is hot enough?",
                    "make this recipe dairy-free",
                    "¿qué hago con sobras de arroz?",
                  ].map((q) => (
                    <div key={q} onClick={() => setChatMsg(q)} style={{ background: "#fff", borderRadius: 12, padding: "10px 14px", marginBottom: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, cursor: "pointer" }}>{q}</div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, maxHeight: 320, overflowY: "auto" }}>
                {chatHistory.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    {msg.role === "assistant" && <BettyFace size={30} style={{ marginRight: 8, alignSelf: "flex-end" }} />}
                    <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? C.userBubble : C.bettyBubble, color: C.text, fontSize: 13, lineHeight: 1.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BettyFace size={30} />
                    <div style={{ padding: "10px 14px", background: C.bettyBubble, borderRadius: "18px 18px 18px 4px", fontSize: 13, color: C.textMuted, fontStyle: "italic" }}>betty is typing...</div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{ display: "flex", gap: 8, background: "#fff", borderRadius: 18, padding: 10, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 14px rgba(180,220,200,0.2)" }}>
                <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChat()} placeholder="ask in any language..." style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontFamily: "Georgia, serif", background: "transparent", color: C.text }} />
                <button onClick={handleChat} disabled={chatLoading} style={{ padding: "8px 14px", background: chatLoading ? "#ddd" : `linear-gradient(135deg, ${C.btnPink}, ${C.btnBlue})`, color: "#fff", border: "none", borderRadius: 12, cursor: chatLoading ? "default" : "pointer", fontSize: 16, boxShadow: chatLoading ? "none" : "0 4px 10px rgba(122,184,232,0.3)" }}>↑</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
