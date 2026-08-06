import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Setup multer for in-memory file handling
  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/upload-invoice", upload.single("invoice"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!process.env.GEMINI_API_KEY) {
         return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
            headers: {
            'User-Agent': 'aistudio-build',
            }
        }
      });

      const imagePart = {
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString("base64"),
        },
      };

      const textPart = {
        text: "Parse this invoice image. Extract the date of the invoice (in YYYY-MM-DD format). Then, extract the quantities for Pot Kulfi flavours and Stick Kulfi flavours. Note that Stick Kulfi quantities shown on the invoice are in packs (each pack contains 6 pieces), but you should return the number of packs, I will multiply by 6 on my end, OR actually, you can multiply the Stick Kulfi quantities by 6 and return the final piece count. For Pot Kulfis, just return the quantity as is. Ensure you correctly classify Pot vs Stick. Generally Pot Kulfis have 'Pot Kulfi' in the name. Return the result in the specified JSON schema.",
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Invoice Date in YYYY-MM-DD" },
              stickFlavours: {
                type: Type.ARRAY,
                description: "Array of Stick Kulfi flavours with their total pieces count (packs * 6)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER, description: "Total pieces (number of packs multiplied by 6)" }
                  }
                }
              },
              potFlavours: {
                type: Type.ARRAY,
                description: "Array of Pot Kulfi flavours with their count",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER }
                  }
                }
              }
            },
            required: ["date", "stickFlavours", "potFlavours"]
          }
        },
      });

      const result = JSON.parse(response.text.trim());
      res.json(result);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to process image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
