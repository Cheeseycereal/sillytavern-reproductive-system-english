// renderer.js — visual rendering of <repro> blocks in chat

import { REPRO_REGEX, EXPIRATION_DEPTH } from './config.js';
import { esc, parseReproBlock } from './helpers.js';

const $ = window.jQuery;
const cleaned = {};

const PHASE_DATA = {
    'menstruation': { icon: 'fa-droplet', label: 'Menstruation' },
    'follicular': { icon: 'fa-seedling', label: 'Follicular' },
    'ovulation': { icon: 'fa-fire', label: 'Ovulation' },
    'luteal': { icon: 'fa-moon', label: 'Luteal' },
    menstruation: { icon: 'fa-droplet', label: 'Menstruation' },
    follicular: { icon: 'fa-seedling', label: 'Follicular' },
    ovulation: { icon: 'fa-fire', label: 'Ovulation' },
    luteal: { icon: 'fa-moon', label: 'Luteal' },
};

function stat(icon, label, value, wide) {
    return `<div class="repro-stat${wide ? ' repro-wide' : ''}"><i class="fa-solid ${icon}"></i><span><span class="rl">${label} </span><span class="rv">${esc(value)}</span></span></div>`;
}

function healthBadge(status) {
    const map = {
        'normal': 'fa-circle-check', normal: 'fa-circle-check', 'healthy': 'fa-circle-check', healthy: 'fa-circle-check',
        'warning': 'fa-triangle-exclamation', warning: 'fa-triangle-exclamation',
        'critical': 'fa-circle-exclamation', critical: 'fa-circle-exclamation',
        'teething': 'fa-tooth', teething: 'fa-tooth',
        'colicky': 'fa-face-sad-cry', colicky: 'fa-face-sad-cry',
        'sick': 'fa-thermometer', sick: 'fa-thermometer',
    };
    const warn = ['warning', 'warning', 'teething', 'teething', 'colicky', 'colicky'];
    const crit = ['critical', 'critical', 'sick', 'sick'];
    const cls = warn.includes(status) ? 'warning' : crit.includes(status) ? 'critical' : 'normal';
    const icon = map[status] || 'fa-circle-check';
    return `<span class="repro-health ${cls}"><i class="fa-solid ${icon}"></i> ${esc(status)}</span>`;
}

function buildCycle(p) {
    const ph = PHASE_DATA[p.phase] || PHASE_DATA['follicular'];
    const day = parseInt(p.cycleDay) || 1;
    const pct = Math.round((day / 28) * 100);
    let h = `<details class="repro" open><summary><i class="fa-solid fa-venus" style="opacity:0.6"></i> Reproductive System <span class="repro-badge cycle">cycle</span></summary><div class="repro-c"><div class="repro-grid">`;
    h += stat(ph.icon, 'day', `${day}/28 — ${ph.label}`, false);
    h += stat('fa-heart-pulse', 'libido', p.libido || '—', false);
    h += `<div class="repro-bar"><div class="repro-bar-fill cycle" style="width:${pct}%"></div></div>`;
    h += stat('fa-brain', 'mood', p.mood || '—', true);
    if (p.symptoms) h += stat('fa-notes-medical', 'symptoms', p.symptoms, true);
    if (p.notes) h += `<div class="repro-note cycle-note"><i class="fa-solid fa-circle-info" style="margin-right:4px;opacity:0.5"></i>${esc(p.notes)}</div>`;
    h += '</div></div></details>';
    return h;
}

function buildPregnancy(p) {
    const week = parseInt(p.week) || 1;
    const pct = Math.min(100, Math.round((week / 42) * 100));
    let h = `<details class="repro" open><summary><i class="fa-solid fa-person-pregnant" style="opacity:0.6"></i> Pregnancy <span class="repro-badge pregnancy">${week} wks</span></summary><div class="repro-c"><div class="repro-grid">`;
    h += stat('fa-calendar-week', 'term', `${week}/40 wks · ${p.trimester} trimester`, true);
    h += `<div class="repro-bar"><div class="repro-bar-fill pregnancy" style="width:${pct}%"></div></div>`;
    h += stat('fa-ruler', 'size', p.babySize || '—', true);
    const sexUnknown = !p.babySex || p.babySex === 'unknown' || p.babySex === 'unknown';
    if (!sexUnknown) h += stat('fa-baby', 'sex', p.babySex, false);
    h += stat('fa-calendar-check', 'due date', p.dueDate || '—', sexUnknown);
    if (p.weightGain) h += stat('fa-weight-scale', 'weight', '+' + p.weightGain, false);
    h += stat('fa-stethoscope', 'health', healthBadge(p.health), false);
    const noActivity = !p.babyActivity || p.babyActivity === 'none' || p.babyActivity === 'none';
    if (!noActivity) h += stat('fa-hand-sparkles', 'activity', p.babyActivity, false);
    h += stat('fa-brain', 'mood', p.mood || '—', false);
    if (p.symptoms) h += stat('fa-notes-medical', 'symptoms', p.symptoms, true);
    if (p.recommendation) h += stat('fa-user-doctor', 'advice', p.recommendation, true);
    if (p.notes) h += `<div class="repro-note"><i class="fa-solid fa-circle-info" style="margin-right:4px;opacity:0.5"></i>${esc(p.notes)}</div>`;
    h += '</div></div></details>';
    return h;
}

function buildBaby(p) {
    const sleepIcons = { 'sleeping': 'fa-moon', sleeping: 'fa-moon', 'crying': 'fa-face-sad-cry', crying: 'fa-face-sad-cry' };
    const sleepIcon = sleepIcons[p.sleep] || 'fa-baby';
    const diaperClean = p.diaper === 'clean' || p.diaper === 'clean';
    let h = `<details class="repro" open><summary><i class="fa-solid fa-baby" style="opacity:0.6"></i> ${esc(p.babyName || 'Baby')} <span class="repro-badge baby">${esc(p.babyAge || '')}</span></summary><div class="repro-c"><div class="repro-grid">`;
    h += stat('fa-baby', 'age', p.babyAge || '—', false);
    h += stat('fa-venus-mars', 'sex', p.babySex || '—', false);
    h += stat('fa-bottle-water', 'feeding', p.feeding || '—', true);
    h += stat(sleepIcon, 'sleep', p.sleep || '—', false);
    h += stat(diaperClean ? 'fa-circle-check' : 'fa-triangle-exclamation', 'diaper', p.diaper || '—', false);
    h += stat('fa-face-smile', 'mood', p.babyMood || '—', false);
    h += stat('fa-stethoscope', 'health', healthBadge(p.health || 'healthy'), false);
    if (p.milestone) h += stat('fa-star', 'development', p.milestone, true);
    if (p.momState) h += stat('fa-person-dress', 'mother', p.momState, true);
    if (p.notes) h += `<div class="repro-note baby-note"><i class="fa-solid fa-circle-info" style="margin-right:4px;opacity:0.5"></i>${esc(p.notes)}</div>`;
    h += '</div></div></details>';
    return h;
}

function buildHtml(p) {
    if (p.mode === 'pregnancy') return buildPregnancy(p);
    if (p.mode === 'baby') return buildBaby(p);
    return buildCycle(p);
}

function isImageBlock(text) {
    return text.includes('[IMG:GEN]') || text.includes('data-iig-instruction');
}

function cleanBlock($t) {
    const html = $t.html();
    if (!html || isImageBlock(html)) return;
    let h = html;
    h = h.replace(/<s_repro[^>]*>[\s\S]*?<\/s_repro>/gi, '');
    h = h.replace(/&lt;s_repro[^&]*&gt;[\s\S]*?&lt;\/s_repro&gt;/gi, '');
    h = h.replace(/<repro>[\s\S]*?<\/repro>/gi, '');
    h = h.replace(/&lt;repro&gt;[\s\S]*?&lt;\/repro&gt;/gi, '');
    if (h !== html) {
        if (window.kissaCleanEmpty) h = window.kissaCleanEmpty(h);
        $t.html(h.trim());
    }
}

function cleanFallbackLines($t) {
    $t.find('p, li, div, span').each(function () {
        const $el = $(this);
        if ($el.closest('.repro, .sims, .diary, .cmp').length) return;
        const t = $el.text();
        if (isImageBlock(t)) return;
        if (/^MODE:\s*(cycle|pregnancy|baby)/i.test(t.trim()) ||
            /^CYCLE_DAY:/i.test(t.trim()) || /^BABY_SIZE:/i.test(t.trim()) ||
            /^BABY_NAME:/i.test(t.trim()) || /^TRIMESTER:/i.test(t.trim()) ||
            /^DUE_DATE:/i.test(t.trim()) || /^MOM_STATE:/i.test(t.trim())) {
            $el.remove();
        }
    });
}

export function renderMessage(messageId) {
    const ctx = SillyTavern.getContext();
    if (!ctx.chat?.[messageId]) return null;

    const text = ctx.chat[messageId].mes || '';
    const match = text.match(REPRO_REGEX);
    if (!match) return null;

    const parsed = parseReproBlock(match[1]);
    if (!parsed.mode) return null;

    const $mes = $(`#chat .mes[mesid="${messageId}"]`);
    if (!$mes.length) return parsed;
    const $t = $mes.find('.mes_text');
    if (!$t.length) return parsed;

    const lastId = ctx.chat.length - 1;
    const isExpired = (lastId - messageId) >= EXPIRATION_DEPTH;

    if ($t.find('.repro').length) return parsed;

    if (!cleaned[messageId]) {
        cleanBlock($t);
        cleanFallbackLines($t);
        cleaned[messageId] = true;
    }

    if (!isExpired) {
        const $sims = $t.find('.sims');
        if ($sims.length) {
            $sims.last().after(buildHtml(parsed));
        } else {
            $t.prepend(buildHtml(parsed));
        }
    }

    return parsed;
}

export function renderAll() {
    Object.keys(cleaned).forEach(k => delete cleaned[k]);
    $('#chat .mes').each(function () {
        const id = $(this).attr('mesid');
        if (id) renderMessage(Number(id));
    });
}

export function invalidateMessage(id) {
    delete cleaned[id];
}
