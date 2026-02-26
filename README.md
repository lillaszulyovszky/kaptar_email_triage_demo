# AI-Powered Bilingual Email Triage System

**Automated email categorization and draft generation for coworking spaces**

## Problem
Coworking spaces receive 50-100 customer emails daily in Hungarian and English. 
Manual processing takes 3-4 hours per day.

## Solution
Google Apps Script system that:
- Categorizes emails into 5 types using Google Gemini AI
- Generates contextual draft replies in the correct language
- Applies bilingual Gmail labels automatically
- Tracks accuracy and time savings

## Tech Stack
- Google Apps Script (JavaScript)
- Google Gemini 1.5 Flash API (AI categorization)
- Gmail API (email management)
- Google Sheets (logging and analytics)

## Features
- 🌍 Bilingual support (Hungarian + English)
- 🤖 90%+ categorization accuracy
- ✍️ Context-aware draft replies
- 📊 Built-in accuracy testing
- 📈 Usage analytics and reporting
- 💰 100% free (uses Gemini free tier)

## Results
- Saves 3.5 hours/day (~€350/month in labor costs)
- 80% auto-draft rate
- ROI: Infinite (€0 operating cost)

## Architecture
[Include screenshot of your 8-file structure]

## Demo
[Include 2-3 min video or GIF]

## Screenshots
[Include your 10 screenshots here]

## Key Learnings
- Gmail API rate limiting and safe testing practices
- UTF-8 character encoding for multilingual content
- AI prompt engineering for bilingual categorization
- Error handling and graceful fallbacks

## Installation
1. Create new Google Sheet
2. Extensions > Apps Script
3. Copy all 8 files from this repo
4. Configure Gemini API key
5. Run setup
