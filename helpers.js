// ═══════════════════════════════════════════
// HELPERS — pure dependency-free functions
// ═══════════════════════════════════════════

export function getSeededRandomSymptoms(arr, count, seed) {
    function seededRandom(s) {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    }
    const indexed = arr.map((item, idx) => ({ item, idx }));
    indexed.sort((a, b) => {
        return seededRandom(seed * 1000 + a.idx) - seededRandom(seed * 1000 + b.idx);
    });
    return indexed.slice(0, count).map(x => x.item).join(', ');
}

export function roll(max = 100) {
    return Math.floor(Math.random() * max) + 1;
}

export function getPhaseInfo(day) {
    if (day <= 5) return { name: 'Menstruation', emoji: '🔴', icon: 'fa-droplet', color: '#ff4444' };
    if (day <= 11) return { name: 'Follicular', emoji: '🌱', icon: 'fa-seedling', color: '#66bb6a' };
    if (day <= 16) return { name: 'Ovulation', emoji: '🔥', icon: 'fa-fire', color: '#ff6b6b' };
    return { name: 'Luteal', emoji: '🌙', icon: 'fa-moon', color: '#ffd43b' };
}

export function getCycleModifier(day) {
    if (day >= 12 && day <= 16) return 1.65;
    if (day >= 8 && day <= 11) return 0.5;
    if (day >= 17) return 0.25;
    return 0.25;
}

export function calculateWeeksFromDates(conceptionDate, rpDate, fallbackWeeks = 0) {
    if (conceptionDate && rpDate) {
        const rpTime = new Date(rpDate).getTime();
        const conceptionTime = new Date(conceptionDate).getTime();
        const diffMs = rpTime - conceptionTime;
        if (diffMs > 0) {
            const totalDays = Math.floor(diffMs / 86400000);
            return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
        }
    }
    return { weeks: fallbackWeeks, days: 0 };
}

export function getSymptomsForProgress(progressPercent, weeks) {
    let pool, count;
    if (progressPercent <= 10) {
        pool = ['missed period', 'mild morning nausea', 'increased fatigue', 'mood swings', 'heightened sense of smell', 'breast tingling', 'daytime sleepiness', 'mild lower abdominal cramps'];
        count = 3;
    } else if (progressPercent <= 20) {
        pool = ['morning sickness (nausea/vomiting)', 'breast tenderness', 'frequent urination', 'metallic taste in the mouth', 'aversion to smells', 'dizziness', 'constipation', 'emotional instability'];
        count = 4;
    } else if (progressPercent <= 30) {
        pool = ['belly beginning to round', 'morning sickness easing', 'emotional swings', 'skin pigmentation changes', 'visible veins on the chest', 'increased appetite', 'shortness of breath when climbing'];
        count = 4;
    } else if (progressPercent <= 40) {
        pool = ['first fetal movements', 'increased libido', 'energy returning', 'breast enlargement', 'thicker hair', 'calf cramps', 'nasal congestion'];
        count = 4;
    } else if (progressPercent <= 50) {
        pool = ['noticeably larger belly', 'increased heartbeat', 'stretch marks', 'colostrum from nipples', 'leg cramps', 'heartburn', 'darkening areolas'];
        count = 5;
    } else if (progressPercent <= 70) {
        pool = ['abdominal heaviness', 'leg swelling by evening', 'lower back pain', 'shortness of breath while walking', 'heartburn', 'insomnia', 'active fetal kicks', 'varicose veins'];
        count = 5;
    } else if (progressPercent <= 90) {
        pool = ['severe fatigue', 'frequent bathroom trips', 'Braxton Hicks contractions', 'difficulty breathing', 'swelling', 'insomnia', 'pelvic pain', 'waddling gait'];
        count = 6;
    } else if (progressPercent <= 100) {
        pool = ['belly has dropped', 'mucus plug loss', 'contractions becoming more frequent', 'leaking fluid', 'diarrhea', 'pulling aches', 'nesting instinct'];
        count = 5;
    } else {
        return '⚠️ OVERDUE! Risk of complications';
    }
    return getSeededRandomSymptoms(pool, count, weeks);
}

export function getRecommendationsForProgress(progressPercent) {
    if (progressPercent <= 10) return 'Early stage: rest and balanced nutrition';
    if (progressPercent <= 20) return 'First trimester: monitoring and small frequent meals';
    if (progressPercent <= 30) return 'Monitor weight, take vitamins, avoid overheating';
    if (progressPercent <= 40) return 'Mid-pregnancy: sex may be determined, stretch-mark massage';
    if (progressPercent <= 50) return 'Belly support band, iron, stretch-mark cream';
    if (progressPercent <= 70) return 'Sleep on the left side, rest, regular monitoring';
    if (progressPercent <= 90) return 'Prepare for birth, exercises, frequent monitoring';
    if (progressPercent <= 100) return 'BIRTH SOON! Be ready!';
    return '⚠️ URGENT! Labor induction may be needed';
}

export function getFetusSizeForProgress(progressPercent, withEmoji = false) {
    const sizes = [
        [5,  'poppy seed (~1-2 mm)',     'fa-seedling',    '🌱'],
        [10, 'grain of rice (~5-10 mm)',        'fa-grain-wheat', '🍚'],
        [15, 'grape (~2-3 cm)',           'fa-apple-whole', '🍇'],
        [20, 'lime (~5-6 cm)',                   'fa-lemon',       '🍋'],
        [25, 'lemon (~7-8 cm)',                  'fa-lemon',       '🍋'],
        [30, 'avocado (~10-12 cm)',              'fa-apple-whole', '🥑'],
        [35, 'mango (~14-16 cm)',                'fa-apple-whole', '🥭'],
        [40, 'banana (~18-20 cm)',                'fa-banana',      '🍌'],
        [50, 'ear of corn (~25-28 cm)',   'fa-wheat-awn',   '🌽'],
        [60, 'eggplant (~30-35 cm)',             'fa-carrot',      '🍆'],
        [70, 'zucchini (~38-40 cm)',              'fa-carrot',      '🥒'],
        [80, 'melon (~42-45 cm)',                 'fa-apple-whole', '🍈'],
        [90, 'watermelon (~45-48 cm)',                'fa-circle',      '🍉'],
    ];
    for (const [threshold, text, icon, emoji] of sizes) {
        if (progressPercent <= threshold) {
            return withEmoji ? `${emoji} ${text}` : text;
        }
    }
    const finalText = 'full-term (~48-52 cm, 2.5-4 kg)';
    return withEmoji ? `👶 ${finalText}` : finalText;
}

export function formatSexIcons(fetusSex, withText = false) {
    if (!fetusSex || fetusSex.length === 0) return '';
    return fetusSex.map(sex => {
        if (withText) return sex === 'M' ? 'boy ♂️' : 'girl ♀️';
        return sex === 'M' ? '♂️' : '♀️';
    }).join(withText ? ', ' : ' ');
}

export function formatFetusCount(count, style = 'short') {
    if (style === 'instrumental') {
        return count === 1 ? 'one fetus' : count === 2 ? 'twins' : 'triplets';
    }
    if (style === 'full') {
        return count === 1 ? '1 fetus' : count === 2 ? '2 fetuses (twins)' : '3 fetuses (triplets)';
    }
    return count === 1 ? '1 fetus' : count === 2 ? 'Twins' : 'Triplets';
}

export function getHealthInfo(healthStatus) {
    if (healthStatus === 'warning') return { text: 'Needs attention', emoji: '⚠️', icon: 'fa-triangle-exclamation', color: '#ffaa00' };
    if (healthStatus === 'critical') return { text: 'CRITICAL', emoji: '🚨', icon: 'fa-circle-exclamation', color: '#ff4444' };
    return { text: 'Normal', emoji: '✅', icon: 'fa-circle-check', color: '#00ff88' };
}
