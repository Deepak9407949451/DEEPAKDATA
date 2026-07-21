import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route for automatic patient folder creation
  app.post("/api/create-folder", (req, res) => {
    try {
      const { patientName, insuranceCompany, admissionDate, destinationPath } = req.body;
      if (!patientName) {
        return res.status(400).json({ success: false, error: "Patient Name is required" });
      }

      // Default destination if empty
      const basePath = destinationPath && destinationPath.trim() !== "" 
        ? destinationPath.trim() 
        : "./PatientFolders";

      // Sanitize the folder name to avoid invalid directory characters or directory traversal issues
      const sanitizedPatient = patientName.replace(/[^a-zA-Z0-9 _-]/g, "").trim();
      const sanitizedInsurance = (insuranceCompany || "No_Insurance").replace(/[^a-zA-Z0-9 _-]/g, "").trim();
      const sanitizedDate = (admissionDate || "").replace(/[^a-zA-Z0-9 _-]/g, "").trim();
      
      const folderName = `${sanitizedPatient} - ${sanitizedInsurance} - ${sanitizedDate}`;
      const targetDir = path.resolve(basePath, folderName);

      // Create target directory recursively
      fs.mkdirSync(targetDir, { recursive: true });

      return res.json({
        success: true,
        message: `Folder created successfully!`,
        path: targetDir,
        folderName
      });
    } catch (error: any) {
      console.error("Folder creation error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create folder on filesystem. Please check permissions."
      });
    }
  });

  // Serve API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
