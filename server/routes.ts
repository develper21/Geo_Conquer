import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { authenticateToken, generateToken, type AuthenticatedRequest } from "./auth";
import bcrypt from "bcryptjs";
import { sendVerificationEmail, verifyCode } from "./email-service";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/users/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userToCreate = { ...userData, password: hashedPassword };      
      const user = await storage.createUser(userToCreate);      
      const token = generateToken(user.id, user.username);
      
      res.status(201).json({ 
        id: user.id, 
        username: user.username,
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users/login", async (req, res) => {
    try {
      const loginSchema = z.object({
        username: z.string().min(1),
        password: z.string().min(1)
      });
      
      const { username, password } = loginSchema.parse(req.body);      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }      
      const token = generateToken(user.id, user.username);
      
      res.json({
        id: user.id,
        username: user.username,
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user by username error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  app.post("/api/auth/send-verification", async (req, res) => {
    try {
      const emailSchema = z.object({
        email: z.string().email("Invalid email format"),
      });
      
      const { email } = emailSchema.parse(req.body);
      const result = await sendVerificationEmail(email);
      
      if (result.success) {
        res.json({ 
          message: "Verification code sent successfully",
          email: email
        });
      } else {
        res.status(500).json({ 
          error: "Failed to send verification email",
          details: result.error
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      console.error("Send verification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const verifySchema = z.object({
        email: z.string().email("Invalid email format"),
        code: z.string().length(6, "Verification code must be 6 digits"),
      });
      
      const { email, code } = verifySchema.parse(req.body);
      const result = verifyCode(email, code);
      
      if (result.success) {
        res.json({ 
          message: "Email verified successfully",
          verified: true
        });
      } else {
        res.status(400).json({ 
          error: result.error || "Verification failed",
          verified: false
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      console.error("Verify code error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
