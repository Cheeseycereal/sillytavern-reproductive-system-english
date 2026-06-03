// ═══════════════════════════════════════════
// MESSAGE-HANDLER — incoming message handling
// ═══════════════════════════════════════════

import { saveSettingsDebounced } from '../../../../script.js';
import { defaultPregnancyData } from './config.js';
import { getSettings, getPregnancyData } from './state.js';
import { roll, formatFetusCount, formatSexIcons } from './helpers.js';
import { parseAIStatus, checkConception } from './pregnancy.js';
import { updatePromptInjection, injectConceptionResult } from './prompts.js';
import { showNotification } from './notifications.js';
import { syncUI } from './ui.js';

export function onMessageReceived() {
    const s = getSettings();
    if (!s.isEnabled) return;

    const chat = typeof SillyTavern?.getContext === 'function' 
        ? SillyTavern.getContext().chat 
        : window.chat;

    if (!chat || chat.length === 0) return;

    const lastMessage = chat[chat.length - 1];
    if (!lastMessage || lastMessage.is_user) return;

    const text = lastMessage.mes;
    
    // Translated note
    const messageId = lastMessage.mes_id || lastMessage.send_date || chat.length;

    console.log('[Reproductive] Checking message...');

    // Translated note
    const p = getPregnancyData();
    const wasPregnant = p.isPregnant;

    parseAIStatus(text);

    // Translated note
    const hasBirthTag = text.includes('[BIRTH]') || 
                        (text.includes('<!--') && text.includes('BIRTH'));
    
    const duration = s.pregnancyDuration || 40;
    const birthThreshold = Math.floor(duration * 0.9); // 90% of term
    
    if (hasBirthTag && p.isPregnant && p.pregnancyWeeks >= birthThreshold) {
        console.log('[Reproductive] Birth tag detected! Delivering baby...');
        
        if (s.showNotifications) {
            showNotification(`🎉 BIRTH! ${formatFetusCount(p.fetusCount)}: ${formatSexIcons(p.fetusSex)}\nCongratulations!`, 'success');
        }
        
        Object.assign(p, structuredClone(defaultPregnancyData));
        saveSettingsDebounced();
        syncUI();
        updatePromptInjection();
        return;
    }

    // Translated note
    const hasConceptionTag = text.includes('[CONCEPTION_CHECK]') || 
                             text.includes('[CONCEPTIONCHECK]') ||
                             (text.includes('<!--') && text.includes('CONCEPTION_CHECK'));

    if (hasConceptionTag) {
        // Translated note
        if (wasPregnant) {
            console.log('[Reproductive] Tag found but was pregnant before parsing - ignoring');
            return;
        }
        
        // Translated note
        if (p.isPregnant) {
            console.log('[Reproductive] Tag found but already pregnant - ignoring');
            return;
        }
        
        // Translated note
        if (s.lastCheckedMessageId === messageId) {
            console.log('[Reproductive] Message already processed - ignoring');
            return;
        }

        // Translated note
        
        // Translated note
        const analKeywords = [
            /anal/i, /in.*ass/i, /in.*butt/i, /backdoor/i, /anus/i, /rectum/i,
            /ass.*fuck/i, /butt.*fuck/i, /sodomy/i
        ];
        
        const oralKeywords = [
            /oral/i, /blowjob/i, /blow.*job/i, /suck.*cock/i, /suck.*dick/i,
            /deepthroat/i, /deep.*throat/i, /mouth.*fuck/i, /throat.*fuck/i,
            /cunnilingus/i
        ];
        
        const hasAnal = analKeywords.some(kw => kw.test(text));
        const hasOral = oralKeywords.some(kw => kw.test(text));
        
        // Translated note
        const ejaculationKeywords = [
            /cum[ms]?(?:ing)?/i, /came/i, /ejaculat/i, /orgasm/i,
            /spurt/i, /shoot/i, /release/i, /seed/i, /load/i
        ];
        
        const insideKeywords = [
            /inside/i, /into her/i, /into you/i, /into me/i,
            /vagin/i, /womb/i, /deep/i, /depths/i,
            /fill(?:ed|ing)?/i, /flood/i, /pump/i
        ];
        
        // Translated note
        const directPhrases = [
            /creampie/i, /cream\s*pie/i,
            /breed/i, /impregnate/i, /knock.*up/i,
            /cum.*inside/i, /came.*inside/i, /cum.*in.*(?:her|you|me|pussy|vagina)/i,
            /filled.*(?:her|you|me).*with/i, /fill.*(?:her|you|me).*up/i
        ];
        
        const hasEjaculation = ejaculationKeywords.some(kw => kw.test(text));
        const hasInside = insideKeywords.some(kw => kw.test(text));
        const hasDirectPhrase = directPhrases.some(kw => kw.test(text));
        
        // Translated note
        const futureTenseOnly = [
            /i will cum/i, /i'm going to cum/i, /gonna cum/i, /about to cum/i,
            /want to cum/i, /i'll cum/i
        ];
        const pastTenseEjaculation = [
            /came/i, /cummed/i, /filled/i, /flooded/i, /pumped/i, /shot/i,
            /released/i, /spilled/i, /emptied/i
        ];
        
        const hasFutureTense = futureTenseOnly.some(kw => kw.test(text));
        const hasPastTense = pastTenseEjaculation.some(kw => kw.test(text));
        
        // Translated note
        if (hasFutureTense && !hasPastTense && !hasDirectPhrase) {
            console.log('[Reproductive] Tag found but only FUTURE tense detected ("will cum") - ejaculation hasn\'t happened yet! Ignoring.');
            return;
        }
        
        // Translated note
        // Translated note
        // Translated note
        // Translated note
        
        let isValidConception = false;
        
        if (hasDirectPhrase) {
            // Translated note
            isValidConception = true;
            console.log('[Reproductive] Direct vaginal phrase detected - valid');
        } else if (hasAnal || hasOral) {
            // Translated note
            console.log(`[Reproductive] Tag found but anal=${hasAnal}, oral=${hasOral} detected without explicit vaginal phrase - ignoring`);
            return;
        } else if (hasEjaculation && hasInside) {
            // Translated note
            isValidConception = true;
            console.log('[Reproductive] Ejaculation + inside detected without anal/oral - valid');
        }
        
        if (!isValidConception) {
            console.log(`[Reproductive] Tag found but content check FAILED: ejaculation=${hasEjaculation}, inside=${hasInside}, direct=${hasDirectPhrase}, anal=${hasAnal}, oral=${hasOral} - ignoring`);
            return;
        }

        console.log('[Reproductive] Tag detected AND vaginal ejaculation confirmed! Rolling conception check...');

        const cycleDayMatch = text.match(/\[CYCLE_DAY:(\d+)\]/);
        if (cycleDayMatch) {
            const aiCycleDay = parseInt(cycleDayMatch[1]);
            if (aiCycleDay >= 1 && aiCycleDay <= 28) {
                s.cycleDay = aiCycleDay;
                s.lastCycleUpdate = Date.now();
            }
        }

        const result = checkConception();
        if (result) {
            injectConceptionResult(result);
        }
        
        // Translated note
        s.lastCheckedMessageId = messageId;
        saveSettingsDebounced();
        syncUI();
    }
}
