PRD: Account Page for Authoring Platform
Overview

The Account Page allows users to manage personal details, subscription, billing, project settings, and AI provider configurations.
This page will be Tauri-powered with React + Vite frontend, persisting all settings via Tauri Store (user_data.json).

Theming must strictly follow the current app color scheme (gradient backgrounds, Tailwind + shadcn/ui components).

Goals

Centralize all account-related settings.

Save/load settings via Tauri store and sync on login/unlock.

Enable AI Provider Management (system + custom).

Support Feature Presets for AI tasks.

Provide Billing & AI Usage History.

Add a new Format Settings tab inside Project Settings.

Ensure settings are stored and retrievable as JSON.

Functional Requirements
1. Account Tabs

Account Details (profile info, avatar, description, links).

Subscription Management (plans, upgrades, current plan).

Billing History

Sub-tab Payment History (existing).

Sub-tab AI Usage History (new: shows AI credit usage, provider spend, remaining credits).

Project Settings (existing).

Format Settings Tab (new, same UI as TypographySettingsPopup).

AI Settings (new, moved out of Project Settings).

2. AI Settings Page

Provider Management

Pre-populated with System (default).

Add connections (OpenRouter, Together.ai, OpenAI, Claude, Google AI Studio, Ollama, Anthropic).

Modeled after NovelCrafter-style provider creation UI.

For each provider:

API Key field.

Usage summary (credits left, spend).

Enable/disable toggle.

Feature Presets

For each AI feature (Rephrase, Expand, Summarize, Generate, Validate, Plan, Suggest):

Select provider + model.

Set System Prompt.

Set Custom Prompt (overrides system).

Save as Preset (multiple presets allowed).

Edit/delete presets.

Option to edit System Preset as well.

AI Credits & Usage

Global overview (linked to Billing).

Breakdown by provider and feature.

Visualization: bar chart or table.

3. Project Settings

Add Format Settings Tab

Use TypographySettingsPopup format.

Configure typography, spacing, style preferences.

Persist in user_data JSON.

Update AI Feature Config Section (minimal AI configuration stays for project-level overrides).

Remove provider selection here (moved to AI Settings page).

Retain toggles, prompts, tone, tokens, etc.

4. Persistence

All account settings stored in Tauri Store (user_data.json).

Load on login/unlock.

Sync with backend API where applicable (user profile, subscription).

Local-first with cloud sync fallback.

Example final JSON structure:

{
  "id": "riNj83daA3oLhPhQRYmh",
  "email": "gill@gmail.com",
  "name": "Shubman Gill",
  "globalRole": "FREE_USER",
  "createdAt": "2025-07-06T04:25:31.357Z",
  "settings": {
    "aiSettings": {
      "providers": [
        {
          "id": "system",
          "name": "System",
          "enabled": true
        },
        {
          "id": "openrouter",
          "name": "OpenRouter",
          "apiKey": "********",
          "enabled": true,
          "spend": 0.0047,
          "limit": 10.0
        }
      ],
      "features": [
        {
          "id": "rephrasing",
          "enabled": true,
          "label": "Rephrasing",
          "presets": [
            {
              "name": "System Default",
              "provider": "system",
              "model": "default",
              "systemPrompt": "Rephrase text concisely",
              "customPrompt": ""
            },
            {
              "name": "Creative Mode",
              "provider": "openrouter",
              "model": "gpt-4",
              "systemPrompt": "Rephrase creatively",
              "customPrompt": "Add metaphors and lyrical flow"
            }
          ]
        }
      ]
    },
    "theme": {
      "color": "blue",
      "customColorHex": "#0000FF"
    },
    "collaboration": {
      "copyAllowed": true,
      "allowComments": true,
      "allowSuggestions": true,
      "allowTrackChanges": false
    },
    "advanced": {
      "temperature": 0.7,
      "maxTokens": 1000,
      "validationLevel": "balanced",
      "tonePreset": "conversational",
      "maxSentenceLength": "medium",
      "vocabularyComplexity": "medium"
    }
  }
}

Non-Functional Requirements

Must respect theme (light/dark, gradient backgrounds).

Tauri store encryption where possible.

Smooth animations (Framer Motion).

Offline-first with eventual sync.

Deliverables

New Account.tsx with extended tabs (AI Settings, Billing AI History).

AISettings.tsx for provider + presets.

FormatSettings.tsx tab under Project Settings.

Updated UserContextProvider.tsx to load/save JSON from Tauri store.

Updated Billing History page with AI usage.