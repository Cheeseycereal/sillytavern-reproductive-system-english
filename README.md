# Reproductive System — SillyTavern Extension

This extension adds a roleplay-oriented reproductive system to SillyTavern: menstrual cycle tracking, conception checks through dice rolls, pregnancy tracking by RP dates, complications, doctor visits, and birth handling.

## Installation

Install the extension in your SillyTavern extensions folder, then restart SillyTavern. The extension will appear in the extensions panel.

## How it works

### Menstrual cycle

- 28-day cycle with four phases: menstruation (days 1-5), follicular (days 6-11), ovulation (days 12-16), and luteal (days 17-28).
- The cycle day can sync from AI text parsing or advance automatically over real time.
- The cycle phase affects conception chance.

### Conception dice roll

The AI places the hidden tag `<!-- [CYCLE_DAY:14][CONCEPTION_CHECK] -->` at the end of a message when vaginal ejaculation inside has already happened. The extension validates the context, rolls conception chance, applies contraception, starts pregnancy on success, and injects the result into the next AI response.

### Pregnancy

Pregnancy term is calculated from RP dates. Duration is configurable from 4 to 100 weeks, with 40 weeks as the default. The UI panel shows progress, symptoms, recommendations, and complications.

### Birth

When pregnancy reaches at least 90% of the configured duration, the AI can place `<!-- [BIRTH] -->`. The extension resets pregnancy data and shows a notification.

## Notes

This package has been translated to English, with default language set to `en`.
