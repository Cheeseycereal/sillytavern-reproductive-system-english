// ═══════════════════════════════════════════
// PREGNANCY — conception, complications, birth
// ═══════════════════════════════════════════

import { saveSettingsDebounced } from '../../../../script.js';
import { CHANCES, defaultPregnancyData } from './config.js';
import { getSettings, getPregnancyData, L } from './state.js';
import { roll, getCycleModifier, getPhaseInfo, calculateWeeksFromDates, formatSexIcons, formatFetusCount } from './helpers.js';
import { parseRpDate, calculateConceptionDate } from './date-parser.js';
import { showNotification } from './notifications.js';

// Translated note
let _syncUI = () => {};
let _updatePromptInjection = () => {};
export function setSyncUI(fn) { _syncUI = fn; }
export function setUpdatePromptInjection(fn) { _updatePromptInjection = fn; }

export function parseAIStatus(text) {
    const s = getSettings();
    const p = getPregnancyData();
    let updated = false;
    let rpDateChanged = false;

    console.log('[Reproductive] Parsing AI status block...');

    const rpDate = parseRpDate(text);
    if (rpDate) {
        const oldRpDate = p.rpDate;
        p.rpDate = rpDate.toISOString();
        if (oldRpDate !== p.rpDate) {
            console.log(`[Reproductive] RP date updated: ${p.rpDate}`);
            rpDateChanged = true;
            updated = true;
            
            // Translated note
            if (p.isPregnant && p.pregnancyWeeks > 0) {
                const newConceptionDate = calculateConceptionDate(new Date(p.rpDate), p.pregnancyWeeks);
                if (newConceptionDate) {
                    p.conceptionDate = newConceptionDate.toISOString();
                    console.log(`[Reproductive] Recalculated conception date: ${p.conceptionDate}`);
                }
            }
        }
    }

    const cycleDayPatterns = [
        /[Dd]ay\s+(?:of\s+cycle[:\s]+)?(\d+)/i,
        /[Cc]ycle[:\s]+(?:[Dd]ay\s+)?(\d+)/i,
        /🩸.*?[Dd]ay\s+(\d+)/i,
        /cycle_day[:\s]*[{]["']?output["']?[:\s]*["'](\d+)["'][}]/i
    ];
    
    for (const pattern of cycleDayPatterns) {
        const match = text.match(pattern);
        if (match) {
            const day = parseInt(match[1]);
            if (day >= 1 && day <= 28 && day !== s.cycleDay) {
                console.log(`[Reproductive] Parsed cycle day: ${s.cycleDay} → ${day}`);
                s.cycleDay = day;
                s.lastCycleUpdate = Date.now();
                updated = true;
                break;
            }
        }
    }

    // Translated note

    const pregnancyPatterns = [
        /[Pp]regnant[^\n]{0,50}(\d+)\s*week/i,
        /[Pp]regnancy[^\n]{0,30}[\(:\s]+(\d+)\s*week/i,
        /(\d+)\s*weeks?\s*(?:of\s+)?pregnan/i,
        /🤰[^\n]{0,30}(\d+)\s*week/i
    ];
    
    let weeks = null;
    for (const pattern of pregnancyPatterns) {
        const match = text.match(pattern);
        if (match) {
            weeks = parseInt(match[1]);
            console.log(`[Reproductive] Matched pregnancy pattern: ${pattern}, weeks: ${weeks}`);
            break;
        }
    }

    let detectedFetusCount = null;
    if (/[Tt]wins?/i.test(text)) {
        detectedFetusCount = 2;
    } else if (/[Tt]riplets?/i.test(text)) {
        detectedFetusCount = 3;
    }
    
    if (weeks !== null && weeks > 0) {
        console.log(`[Reproductive] Parsed pregnancy: ${weeks} weeks`);

        // Translated note
        // Translated note
        // Translated note
        // Translated note
        
        if (!p.isPregnant) {
            // Translated note
            console.log('[Reproductive] AI mentions pregnancy but character is not pregnant - ignoring (use [CONCEPTION_CHECK] tag or manual setup)');
        } else {
            // Translated note
            if (detectedFetusCount && detectedFetusCount !== p.fetusCount) {
                p.fetusCount = detectedFetusCount;
                while (p.fetusSex.length < p.fetusCount) {
                    p.fetusSex.push(roll(2) === 1 ? 'M' : 'F');
                }
                p.fetusSex = p.fetusSex.slice(0, p.fetusCount);
                updated = true;
            }
            
            if (weeks !== p.pregnancyWeeks) {
                console.log(`[Reproductive] Pregnancy week mismatch: ours=${p.pregnancyWeeks}, AI=${weeks}. Resyncing...`);
                p.pregnancyWeeks = weeks;
                
                // Translated note
                if (p.rpDate) {
                    const conceptionDate = calculateConceptionDate(new Date(p.rpDate), weeks);
                    if (conceptionDate) {
                        p.conceptionDate = conceptionDate.toISOString();
                    }
                }
                
                updated = true;
                if (s.showNotifications) {
                    showNotification(`🔄 Term updated: ${weeks} weeks`, 'info');
                }
            }
        }
    }

    // Translated note
    // Translated note

    if (updated) {
        saveSettingsDebounced();
        _syncUI();
        _updatePromptInjection();
    }

    return updated;
}

export function updateCycleDay() {
    const s = getSettings();
    if (!s.isEnabled) return;

    const now = Date.now();

    if (!s.lastCycleUpdate) {
        s.lastCycleUpdate = now;
        saveSettingsDebounced();
        return;
    }

    const timeDiff = now - s.lastCycleUpdate;
    const daysPassed = Math.floor(timeDiff / 86400000);

    if (daysPassed > 0) {
        const oldDay = s.cycleDay;
        s.cycleDay += daysPassed;
        while (s.cycleDay > 28) {
            s.cycleDay -= 28;
        }
        s.lastCycleUpdate = now;

        console.log(`[Reproductive] Auto-update: ${oldDay} → ${s.cycleDay} (${daysPassed} days passed)`);
        saveSettingsDebounced();
        _syncUI();
        _updatePromptInjection();

        if (s.showNotifications) {
            showNotification(`📅 Cycle day updated: ${s.cycleDay}`, 'info');
        }
    }
}

export function checkConception() {
    const s = getSettings();
    const p = getPregnancyData();

    if (!s.isEnabled) return null;
    if (p.isPregnant) {
        console.log('[Reproductive] Already pregnant, skipping check');
        return null;
    }

    s.totalChecks++;

    const cycleModifier = getCycleModifier(s.cycleDay);
    // Translated note
    let chance = Math.round(CHANCES.base * cycleModifier);

    const contraceptionEff = CHANCES.contraception[s.contraception];
    let contraceptionFailed = false;

    if (s.contraception !== 'none') {
        const failRoll = roll(100);
        if (failRoll > contraceptionEff) {
            contraceptionFailed = true;
            if (s.showNotifications) {
                showNotification(L('contraceptionFailed'), 'warning');
            }
        } else {
            chance = Math.round(chance * (1 - contraceptionEff / 100));
        }
    }

    const conceptionRoll = roll(100);
    const success = conceptionRoll <= chance;

    console.log(`[Reproductive] Check: roll=${conceptionRoll}, need<=${chance}, result=${success ? 'PREGNANT' : 'no'}`);

    const result = {
        roll: conceptionRoll,
        chance: chance,
        contraception: s.contraception,
        contraceptionFailed: contraceptionFailed,
        cycleDay: s.cycleDay,
        success: success
    };

    if (success) {
        p.isPregnant = true;

        if (p.rpDate) {
            p.conceptionDate = p.rpDate;
            console.log(`[Reproductive] Conception date set to RP date: ${p.conceptionDate}`);
        } else {
            p.conceptionDate = new Date().toISOString();
            console.log(`[Reproductive] Conception date set to Real time (fallback): ${p.conceptionDate}`);
        }


        p.pregnancyWeeks = 0;
        s.totalConceptions++;

        // Translated note
        const twinsChance = s.twinsChance || 3;
        const tripletsChance = s.tripletsChance || 0.1;
        
        const multiplesRoll = roll(1000) / 10;
        if (multiplesRoll <= tripletsChance) {
            p.fetusCount = 3;
        } else if (multiplesRoll <= twinsChance) {
            p.fetusCount = 2;
        } else {
            p.fetusCount = 1;
        }

        p.fetusSex = [];
        for (let i = 0; i < p.fetusCount; i++) {
            p.fetusSex.push(roll(2) === 1 ? 'M' : 'F');
        }

        if (s.showNotifications) {
            showNotification(`✅ Pregnant! Day ${s.cycleDay}, ${conceptionRoll}/${chance}\n${formatFetusCount(p.fetusCount)} | Sex: ${formatSexIcons(p.fetusSex)}`, 'success');
        }
    } else {
        if (s.showNotifications) {
            showNotification(`❌ Not pregnant. Day ${s.cycleDay}, ${conceptionRoll}/${chance}`, 'info');
        }
    }

    saveSettingsDebounced();
    _syncUI();

    return result;
}

export function checkComplications() {
    const s = getSettings();
    const p = getPregnancyData();
    
    if (!p.isPregnant) return;
    if (!p.rpDate) return;

    const { weeks } = calculateWeeksFromDates(p.conceptionDate, p.rpDate, p.pregnancyWeeks);

    const currentRpDate = new Date(p.rpDate);
    
    if (p.lastComplicationCheckRpDate) {
        const lastCheckRpDate = new Date(p.lastComplicationCheckRpDate);
        const daysSinceCheckRp = Math.floor((currentRpDate - lastCheckRpDate) / 86400000);
        
        if (daysSinceCheckRp < 7) {
            console.log(`[Reproductive] Complication check skipped: only ${daysSinceCheckRp} RP days since last check`);
            return;
        }
    }

    p.lastComplicationCheckRpDate = p.rpDate;

    if (s.showNotifications) {
        showNotification(`🩺 Health check (${weeks} weeks)...`, 'info');
    }

    let baseChance = weeks <= 12 ? 15 : weeks <= 27 ? 5 : 12;
    if (p.fetusCount >= 2) baseChance += 10;
    if (p.fetusCount >= 3) baseChance += 15;
    
    // Translated note
    const warningCount = (p.complications || []).filter(c => c.severity === 'warning' && !c.resolved).length;
    if (warningCount >= 2) baseChance += 10;

    const complicationRoll = roll(100);
    console.log(`[Reproductive] Complication check: roll=${complicationRoll}, threshold=${baseChance}, warnings=${warningCount}`);

    if (complicationRoll <= baseChance) {
        const types = getComplicationTypes(weeks);
        const complication = types[Math.floor(Math.random() * types.length)];

        p.complications.push({
            week: weeks,
            type: complication.type,
            severity: complication.severity,
            description: complication.description,
            rpDate: p.rpDate,
            date: new Date().toISOString(),
            resolved: false
        });

        if (complication.severity === 'critical') {
            p.healthStatus = 'critical';
        } else if (complication.severity === 'warning' && p.healthStatus === 'normal') {
            p.healthStatus = 'warning';
        }

        saveSettingsDebounced();
        _syncUI();

        if (s.showNotifications) {
            const emoji = complication.severity === 'critical' ? '🚨' : '⚠️';
            showNotification(`${emoji} COMPLICATION: ${complication.type}\n${complication.description}`, 
                           complication.severity === 'critical' ? 'warning' : 'info');
        }
        
        // Translated note
        handleComplicationConsequences(complication, weeks);
        
    } else {
        // Translated note
        if (warningCount > 0 && roll(100) <= 30) {
            const unresolvedWarning = p.complications.find(c => c.severity === 'warning' && !c.resolved);
            if (unresolvedWarning) {
                unresolvedWarning.resolved = true;
                if (s.showNotifications) {
                    showNotification(`💊 ${unresolvedWarning.type} — condition improved!`, 'success');
                }
                const hasUnresolvedCritical = p.complications.some(c => c.severity === 'critical' && !c.resolved);
                const hasUnresolvedWarning = p.complications.some(c => c.severity === 'warning' && !c.resolved);
                p.healthStatus = hasUnresolvedCritical ? 'critical' : hasUnresolvedWarning ? 'warning' : 'normal';
            }
        }
        
        if (s.showNotifications) {
            showNotification(`✅ Check passed: everything is normal!`, 'success');
        }
        saveSettingsDebounced();
        _syncUI();
    }
}

export function handleComplicationConsequences(complication, weeks) {
    const s = getSettings();
    const p = getPregnancyData();
    
    // Translated note
    if (complication.type === 'Threatened miscarriage') {
        const miscarriageRoll = roll(100);
        console.log(`[Reproductive] Miscarriage roll: ${miscarriageRoll} (need >25 to survive)`);
        
        if (miscarriageRoll <= 25) {
            if (s.showNotifications) {
                showNotification(`💔 MISCARRIAGE\nPregnancy ended at week ${weeks}...`, 'warning');
            }
            setTimeout(() => {
                Object.assign(p, structuredClone(defaultPregnancyData));
                saveSettingsDebounced();
                _syncUI();
                _updatePromptInjection();
            }, 1000);
            return;
        } else {
            if (s.showNotifications) {
                showNotification(`🏥 Danger has passed! Rest is required.`, 'info');
            }
        }
    }
    
    // Translated note
    if (complication.type === 'Premature birth') {
        const statusText = weeks < 32 ? '⚠️ Premature!' : weeks < 37 ? '⚠️ Early, but stable.' : '✅ Full-term!';
        
        if (s.showNotifications) {
            showNotification(`👶 PREMATURE BIRTH (${weeks} weeks)\n${formatFetusCount(p.fetusCount)}: ${formatSexIcons(p.fetusSex)}\n${statusText}`, 'warning');
        }
        setTimeout(() => {
            Object.assign(p, structuredClone(defaultPregnancyData));
            saveSettingsDebounced();
            _syncUI();
            _updatePromptInjection();
        }, 1000);
        return;
    }
    
    // Translated note
    if (complication.type === 'Preeclampsia') {
        const emergencyRoll = roll(100);
        console.log(`[Reproductive] Gestosis emergency roll: ${emergencyRoll} (need >15 to avoid)`);
        
        if (emergencyRoll <= 15) {
            if (s.showNotifications) {
                showNotification(`🚨 EMERGENCY C-SECTION!\nPreeclampsia is life-threatening.\nBaby: ${formatSexIcons(p.fetusSex)}`, 'warning');
            }
            setTimeout(() => {
                Object.assign(p, structuredClone(defaultPregnancyData));
                saveSettingsDebounced();
                _syncUI();
                _updatePromptInjection();
            }, 1000);
            return;
        } else {
            if (s.showNotifications) {
                showNotification(`🏥 Preeclampsia is under control. Bed rest!`, 'info');
            }
        }
    }
    
    // Translated note
    if (complication.type === 'Cervical insufficiency') {
        const icnRoll = roll(100);
        console.log(`[Reproductive] ICN roll: ${icnRoll} (need >20 to survive)`);
        
        if (icnRoll <= 20) {
            if (s.showNotifications) {
                showNotification(`💔 Cervical insufficiency caused pregnancy loss at ${weeks} week...`, 'warning');
            }
            setTimeout(() => {
                Object.assign(p, structuredClone(defaultPregnancyData));
                saveSettingsDebounced();
                _syncUI();
                _updatePromptInjection();
            }, 1000);
            return;
        } else {
            if (s.showNotifications) {
                showNotification(`🏥 Cervical insufficiency detected. Cerclage/pessary placed, bed rest!`, 'info');
            }
        }
    }
    
    // Translated note
    if (complication.type === 'Placental abruption') {
        const abruptionRoll = roll(100);
        console.log(`[Reproductive] Placental abruption roll: ${abruptionRoll} (need >30 to survive)`);
        
        if (abruptionRoll <= 30) {
            if (weeks < 24) {
                if (s.showNotifications) {
                    showNotification(`💔 Placental abruption caused pregnancy loss...`, 'warning');
                }
            } else {
                if (s.showNotifications) {
                    showNotification(`🚨 EMERGENCY DELIVERY due to placental abruption!\n${formatFetusCount(p.fetusCount)}: ${formatSexIcons(p.fetusSex)}`, 'warning');
                }
            }
            setTimeout(() => {
                Object.assign(p, structuredClone(defaultPregnancyData));
                saveSettingsDebounced();
                _syncUI();
                _updatePromptInjection();
            }, 1000);
            return;
        } else {
            if (s.showNotifications) {
                showNotification(`🏥 Partial abruption is under control. Strict bed rest!`, 'info');
            }
        }
    }
    
    // Translated note
    const unresolvedWarnings = (p.complications || []).filter(c => c.severity === 'warning' && !c.resolved).length;
    if (unresolvedWarnings >= 3) {
        const criticalRoll = roll(100);
        console.log(`[Reproductive] Warning accumulation: ${unresolvedWarnings} warnings, roll=${criticalRoll}`);
        
        if (criticalRoll <= 20) {
            p.healthStatus = 'critical';
            
            if (weeks <= 12) {
                if (s.showNotifications) {
                    showNotification(`💔 Complications caused pregnancy loss...`, 'warning');
                }
                setTimeout(() => {
                    Object.assign(p, structuredClone(defaultPregnancyData));
                    saveSettingsDebounced();
                    _syncUI();
                    _updatePromptInjection();
                }, 1000);
                return;
            } else {
                if (s.showNotifications) {
                    showNotification(`🚨 CRITICAL CONDITION!\nUrgent medical help is needed!`, 'warning');
                }
            }
            saveSettingsDebounced();
            _syncUI();
        }
    }
}

export function getComplicationTypes(weeks) {
    if (weeks <= 12) {
        return [
            { type: 'Morning sickness', severity: 'warning', description: 'Severe nausea, vomiting up to 5 times a day' },
            { type: 'Threatened miscarriage', severity: 'critical', description: 'Pulling lower abdominal pain, bloody discharge' },
            { type: 'Anemia', severity: 'warning', description: 'Low hemoglobin, weakness, dizziness' }
        ];
    } else if (weeks <= 27) {
        return [
            { type: 'Placenta previa', severity: 'critical', description: 'Placenta blocks the uterine outlet' },
            { type: 'Cervical insufficiency', severity: 'critical', description: 'Cervical insufficiency — cervix shortens, risk of premature birth' },
            { type: 'Gestational diabetes', severity: 'warning', description: 'High blood sugar, diet required' },
            { type: 'Swelling', severity: 'warning', description: 'Fluid retention, swollen legs and hands' },
            { type: 'Placental abruption', severity: 'critical', description: 'Partial separation of the placenta from the uterine wall, bleeding' }
        ];
    } else {
        return [
            { type: 'Preeclampsia', severity: 'critical', description: 'High blood pressure, protein in urine, severe swelling' },
            { type: 'Premature birth', severity: 'critical', description: 'Contractions before 37 weeks, risk of prematurity' },
            { type: 'Placental abruption', severity: 'critical', description: 'Placental separation, heavy bleeding, life-threatening risk' },
            { type: 'FGR', severity: 'warning', description: 'Fetal growth restriction — fetus is smaller than expected for term' },
            { type: 'Oligohydramnios', severity: 'warning', description: 'Not enough amniotic fluid' },
            { type: 'Symphysis pubis dysfunction', severity: 'warning', description: 'Separation of the pubic joint, pain while walking' }
        ];
    }
}

export function resetPregnancy() {
    const p = getPregnancyData();
    Object.assign(p, structuredClone(defaultPregnancyData));
    saveSettingsDebounced();
    _syncUI();
    _updatePromptInjection();
}

export function visitDoctor() {
    const s = getSettings();
    const p = getPregnancyData();
    
    if (!p.isPregnant) return;
    
    // Translated note
    if (p.lastDoctorVisitRpDate && p.rpDate) {
        const lastVisit = new Date(p.lastDoctorVisitRpDate);
        const currentRpDate = new Date(p.rpDate);
        const daysSinceVisit = Math.floor((currentRpDate - lastVisit) / 86400000);
        
        if (daysSinceVisit < 3) {
            if (s.showNotifications) {
                showNotification(`🏥 Next visit in ${3 - daysSinceVisit} RP days.`, 'info');
            }
            return;
        }
    }
    
    // Translated note
    p.lastDoctorVisitRpDate = p.rpDate || new Date().toISOString();
    
    // Translated note
    const unresolvedComplications = p.complications.filter(c => !c.resolved);
    
    if (unresolvedComplications.length === 0) {
        if (s.showNotifications) {
            showNotification(`🏥 Doctor: Everything is fine, no complications!`, 'success');
        }
        saveSettingsDebounced();
        return;
    }
    
    // Translated note
    let healed = 0;
    let failed = 0;
    
    for (const complication of unresolvedComplications) {
        // Translated note
        const healChance = complication.severity === 'critical' ? 50 : 75;
        const healRoll = roll(100);
        
        console.log(`[Reproductive] Doctor treating ${complication.type}: roll=${healRoll}, need<=${healChance}`);
        
        if (healRoll <= healChance) {
            complication.resolved = true;
            healed++;
        } else {
            failed++;
        }
    }
    
    // Translated note
    const hasUnresolvedCritical = p.complications.some(c => c.severity === 'critical' && !c.resolved);
    const hasUnresolvedWarning = p.complications.some(c => c.severity === 'warning' && !c.resolved);
    p.healthStatus = hasUnresolvedCritical ? 'critical' : hasUnresolvedWarning ? 'warning' : 'normal';
    
    saveSettingsDebounced();
    _syncUI();
    
    // Translated note
    if (s.showNotifications) {
        if (healed > 0 && failed === 0) {
            showNotification(`🏥 Doctor helped!\n✅ Treated: ${healed} complications`, 'success');
        } else if (healed > 0 && failed > 0) {
            showNotification(`🏥 Partial success\n✅ Treated: ${healed}\n⚠️ Needs monitoring: ${failed}`, 'info');
        } else {
            showNotification(`🏥 Treatment did not help\n⚠️ Another visit is required`, 'warning');
        }
    }
}

