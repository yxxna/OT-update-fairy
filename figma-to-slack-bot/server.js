import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json({ type: "*/*" }));

const PORT = process.env.PORT || 3000;
const PASSCODE = process.env.FIGMA_WEBHOOK_PASSCODE;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

function must(value, name) {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

app.get("/", (req, res) => {
  res.status(200).send("ok");
});

app.post("/figma/webhook", async (req, res) => {
  try {
    must(PASSCODE, "FIGMA_WEBHOOK_PASSCODE");
    must(SLACK_WEBHOOK_URL, "SLACK_WEBHOOK_URL");
    must(FIGMA_TOKEN, "FIGMA_TOKEN");

    // 1) Figma passcode 검증
    const incomingPasscode = req.body?.passcode;
    if (incomingPasscode !== PASSCODE) {
      return res.status(401).json({ ok: false, error: "Invalid passcode" });
    }

    // 2) 이벤트 타입 필터
    const eventType = req.body?.event_type;
    if (eventType !== "FILE_VERSION_UPDATE") {
      return res.status(200).json({ ok: true, ignored: eventType });
    }

    // 3) Figma에 빠른 응답 (중요)
    res.status(200).json({ ok: true });

    // 4) Slack 메시지 구성 (payload는 환경/권한에 따라 필드가 달라질 수 있어 fallback 처리)
    const fileName = req.body?.file_name || "Unknown file";
    const fileKey = req.body?.file_key || "";
    const versionId = req.body?.version_id || req.body?.version?.id || "";
    const triggeredBy =
      req.body?.triggered_by?.handle ||
      req.body?.triggered_by?.name ||
      req.body?.triggered_by?.id ||
      "someone";
    
      // (추가) 버전 히스토리에서 Title/Description 가져오기
    let versionLabel = "";
    let versionDesc = "";

    if (fileKey && versionId) {
      try {
        const vr = await fetch(`https://api.figma.com/v1/files/${fileKey}/versions`, {
          headers: { "X-Figma-Token": FIGMA_TOKEN }
        });

        if (vr.ok) {
          const data = await vr.json();
          const hit = (data?.versions || []).find(v => String(v.id) === String(versionId));
          versionLabel = hit?.label || "";
          versionDesc = hit?.description || "";
        } else {
          const body = await vr.text().catch(() => "");
          console.warn("Figma versions fetch failed:", vr.status, body);
        }
      } catch (e) {
        console.warn("Figma versions fetch error:", e);
      }
    }
      


    const figmaFileUrl = fileKey ? `https://www.figma.com/file/${fileKey}` : "https://www.figma.com/";

    const BUILD_MARK = "BUILD_2026-02-25_16:40";

    const text =
      `📌 *Figma 버전 업데이트* 📌\n` +
      `• 파일: *${fileName}*\n` +
      `• build: ${BUILD_MARK}\n` +
      (versionLabel ? `• ⬆️ 버전: ${versionLabel}\n` : "") +         // ✅ 네가 Title에 적는 v12
      (versionDesc ? `• ❇️ 변경점: ${versionDesc}\n` : "") +          // (원하면 유지)
      `• 작성자: ${triggeredBy}\n` +
      `• 링크: ${figmaFileUrl}`;

    const r = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      console.error("Slack webhook failed:", r.status, body);
    }
  } catch (e) {
    console.error("Webhook error:", e);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
