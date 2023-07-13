import express from "express";
import passport from "passport";
import homepage from "../controllers/homepage";

const router = express.Router();

router.get("/", homepage.homepage_get);

export default router;
