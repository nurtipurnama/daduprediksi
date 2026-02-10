// ============================================
// 🎲 DICE ROLL ANALYSIS SYSTEM
// ============================================

class DiceAnalysisSystem {
    constructor() {
        this.games = [];
        this.maxMemoryWindow = 20;
        this.loadFromLocalStorage();
        this.initEventListeners();
        this.render();
    }

    // ============ INITIALIZATION ============
    initEventListeners() {
        document.getElementById('inputForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAllData());
    }

    // ============ STATE DETECTION ============
    getState(roll) {
        if (roll >= 6 && roll <= 18) return 'LOW';
        if (roll >= 19 && roll <= 31) return 'MID';
        if (roll >= 32 && roll <= 43) return 'HIGH';
        if (roll >= 44 && roll <= 54) return 'EXTREME';
        return 'UNKNOWN';
    }

    getStateClass(state) {
        return `state-${state.toLowerCase()}`;
    }

    getClassification(roll) {
        return roll <= 31 ? 'KECIL' : 'BESAR';
    }

    // ============ NUMERIC TREND ============
    calculateTrend(roll1, roll2) {
        const diff = roll2 - roll1;
        if (diff > 0) return { direction: 'naik', diff };
        if (diff < 0) return { direction: 'turun', diff };
        return { direction: 'stabil', diff };
    }

    getTrendClass(direction) {
        return `trend-${direction}`;
    }

    // ============ FORM HANDLING ============
    handleFormSubmit(e) {
        e.preventDefault();
        const roll1 = parseInt(document.getElementById('roll1').value);
        const roll2 = parseInt(document.getElementById('roll2').value);

        if (roll1 < 6 || roll1 > 54 || roll2 < 6 || roll2 > 54) {
            alert('Input harus antara 6-54');
            return;
        }

        const game = {
            id: Date.now(),
            roll1,
            roll2,
            state1: this.getState(roll1),
            state2: this.getState(roll2),
            trend: this.calculateTrend(roll1, roll2),
            classification: this.getClassification(roll2),
            timestamp: new Date()
        };

        this.games.push(game);
        this.saveToLocalStorage();
        this.render();

        // Reset form
        document.getElementById('inputForm').reset();
        document.getElementById('roll1').focus();
    }

    // ============ DATA MANAGEMENT ============
    saveToLocalStorage() {
        localStorage.setItem('diceGames', JSON.stringify(this.games));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('diceGames');
        this.games = stored ? JSON.parse(stored) : [];
    }

    clearAllData() {
        if (confirm('Hapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
            this.games = [];
            this.saveToLocalStorage();
            this.render();
        }
    }

    // ============ ANALYTICS - NUMERIC TREND ============
    getRecentGames(count = this.maxMemoryWindow) {
        return this.games.slice(-count);
    }

    analyzeTrendDirection() {
        if (this.games.length === 0) return null;

        const recentGames = this.getRecentGames();
        let upCount = 0, downCount = 0, stableCount = 0;

        recentGames.forEach(game => {
            if (game.trend.direction === 'naik') upCount++;
            else if (game.trend.direction === 'turun') downCount++;
            else stableCount++;
        });

        return { upCount, downCount, stableCount };
    }

    getTrendDominant() {
        const trendAnalysis = this.analyzeTrendDirection();
        if (!trendAnalysis) return '-';

        if (trendAnalysis.upCount > trendAnalysis.downCount && trendAnalysis.upCount > trendAnalysis.stableCount)
            return 'Naik ↑';
        if (trendAnalysis.downCount > trendAnalysis.upCount && trendAnalysis.downCount > trendAnalysis.stableCount)
            return 'Turun ↓';
        return 'Stabil →';
    }

    // ============ ANALYTICS - STATE TRANSITION ============
    buildTransitionMatrix() {
        if (this.games.length < 2) return null;

        const states = ['LOW', 'MID', 'HIGH', 'EXTREME'];
        const matrix = {};

        states.forEach(from => {
            matrix[from] = {};
            states.forEach(to => {
                matrix[from][to] = 0;
            });
        });

        for (let i = 1; i < this.games.length; i++) {
            const fromState = this.games[i - 1].state2;
            const toState = this.games[i].state1;
            matrix[fromState][toState]++;
        }

        return matrix;
    }

    getStateTransitionProbability(fromState) {
        const matrix = this.buildTransitionMatrix();
        if (!matrix) return null;

        const transitions = matrix[fromState];
        const total = Object.values(transitions).reduce((a, b) => a + b, 0);

        if (total === 0) return null;

        const probability = {};
        for (const [toState, count] of Object.entries(transitions)) {
            probability[toState] = Math.round((count / total) * 100);
        }

        return probability;
    }

    // ============ ANALYTICS - CLASSIFICATION FREQUENCY ============
    getClassificationFrequency() {
        if (this.games.length === 0) return { KECIL: 0, BESAR: 0 };

        const recent = this.getRecentGames();
        let kecilCount = 0, besarCount = 0;

        recent.forEach(game => {
            if (game.classification === 'KECIL') kecilCount++;
            else besarCount++;
        });

        return { KECIL: kecilCount, BESAR: besarCount };
    }

    // ============ ANALYTICS - STATE DOMINANCE ============
    getStateDominance() {
        if (this.games.length === 0) return {};

        const recent = this.getRecentGames();
        const stateCounts = { LOW: 0, MID: 0, HIGH: 0, EXTREME: 0 };

        recent.forEach(game => {
            stateCounts[game.state2]++;
        });

        return stateCounts;
    }

    getLastState() {
        if (this.games.length === 0) return null;
        return this.games[this.games.length - 1].state2;
    }

    // ============ PREDICTION LOGIC ============
    predictNextOutcome() {
        if (this.games.length < 5) {
            return { canPredict: false, reason: 'Data belum cukup (minimal 5 game)' };
        }

        const trendAnalysis = this.analyzeTrendDirection();
        const stateDominance = this.getStateDominance();
        const lastState = this.getLastState();
        const stateTransitionProb = this.getStateTransitionProbability(lastState);
        const classificationFreq = this.getClassificationFrequency();
        const avgRoll2 = this.games.reduce((sum, g) => sum + g.roll2, 0) / this.games.length;

        // ============ HYBRID SCORING ============
        let kecilScore = 0;
        let besarScore = 0;

        // 1️⃣ Numeric Trend Component (25%)
        const trendWeight = 0.25;
        if (trendAnalysis.downCount > trendAnalysis.upCount) {
            kecilScore += trendWeight * 0.6; // Tren turun → cenderung kecil
        } else {
            besarScore += trendWeight * 0.6;
        }

        // 2️⃣ State Dominance Component (30%)
        const stateWeight = 0.30;
        const totalStateCount = Object.values(stateDominance).reduce((a, b) => a + b, 0);
        const lowMidDominance = (stateDominance.LOW + stateDominance.MID) / totalStateCount || 0;
        const highExtremeDominance = (stateDominance.HIGH + stateDominance.EXTREME) / totalStateCount || 0;

        kecilScore += stateWeight * lowMidDominance;
        besarScore += stateWeight * highExtremeDominance;

        // 3️⃣ State Transition Component (25%)
        const transitionWeight = 0.25;
        if (stateTransitionProb) {
            const lowMidTransitionProb = ((stateTransitionProb['LOW'] || 0) + (stateTransitionProb['MID'] || 0)) / 100 || 0;
            const highExtremeTransitionProb = ((stateTransitionProb['HIGH'] || 0) + (stateTransitionProb['EXTREME'] || 0)) / 100 || 0;

            kecilScore += transitionWeight * lowMidTransitionProb;
            besarScore += transitionWeight * highExtremeTransitionProb;
        }

        // 4️⃣ Distance from Center Component (20%)
        const centerWeight = 0.20;
        const CENTER = 30; // Titik tengah K-B
        const distanceFromCenter = Math.abs(avgRoll2 - CENTER);
        const maxDistance = 24; // Jarak maksimal dari center

        if (avgRoll2 < CENTER) {
            kecilScore += centerWeight * (1 - distanceFromCenter / maxDistance);
        } else {
            besarScore += centerWeight * (1 - distanceFromCenter / maxDistance);
        }

        // ============ NORMALIZATION ============
        const totalScore = kecilScore + besarScore;
        const kecilPercent = Math.round((kecilScore / totalScore) * 100);
        const besarPercent = 100 - kecilPercent;

        return {
            canPredict: true,
            KECIL: kecilPercent,
            BESAR: besarPercent,
            reasoning: {
                trendDirection: trendAnalysis,
                stateDominance,
                lastState,
                stateTransitionProb,
                avgRoll2: Math.round(avgRoll2 * 10) / 10
            }
        };
    }

    // ============ RENDER ============
    render() {
        this.renderStats();
        this.renderTable();
        this.renderTrendChart();
        this.renderTransitionMatrix();
        this.renderPrediction();
    }

    renderStats() {
        document.getElementById('totalGames').textContent = this.games.length;

        if (this.games.length === 0) {
            document.getElementById('avgRoll1').textContent = '0';
            document.getElementById('avgRoll2').textContent = '0';
            document.getElementById('trendDominant').textContent = '-';
            return;
        }

        const avgRoll1 = (this.games.reduce((sum, g) => sum + g.roll1, 0) / this.games.length).toFixed(1);
        const avgRoll2 = (this.games.reduce((sum, g) => sum + g.roll2, 0) / this.games.length).toFixed(1);

        document.getElementById('avgRoll1').textContent = avgRoll1;
        document.getElementById('avgRoll2').textContent = avgRoll2;
        document.getElementById('trendDominant').textContent = this.getTrendDominant();
    }

    renderTable() {
        const tbody = document.getElementById('tableBody');

        if (this.games.length === 0) {
            tbody.innerHTML = '<tr class="empty-state"><td colspan="8">Data kosong. Mulai input game pertama Anda!</td></tr>';
            return;
        }

        tbody.innerHTML = this.games.map((game, idx) => `
            <tr>
                <td><strong>#${idx + 1}</strong></td>
                <td>${game.roll1}</td>
                <td><span class="state-badge ${this.getStateClass(game.state1)}">${game.state1}</span></td>
                <td>${game.roll2}</td>
                <td><span class="state-badge ${this.getStateClass(game.state2)}">${game.state2}</span></td>
                <td>${game.trend.diff > 0 ? '+' : ''}${game.trend.diff}</td>
                <td><span class="${this.getTrendClass(game.trend.direction)}">${game.trend.direction.toUpperCase()}</span></td>
                <td><strong>${game.classification}</strong></td>
            </tr>
        `).join('');
    }

    renderTrendChart() {
        const canvas = document.getElementById('trendChart');
        const ctx = canvas.getContext('2d');
        const recent = this.getRecentGames(15);

        if (recent.length === 0) {
            document.getElementById('trendSummary').innerHTML = '<p class="empty-state">Data belum cukup untuk analisis tren</p>';
            return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 50;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;

        // Setup
        const maxValue = 54;
        const minValue = 6;
        const dataPoints = recent.map((g, idx) => ({
            idx,
            roll1: g.roll1,
            roll2: g.roll2
        }));

        // Draw grid
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }

        // Draw lines
        ctx.lineWidth = 2;

        // Roll 1 (Blue)
        ctx.strokeStyle = '#3498db';
        ctx.beginPath();
        dataPoints.forEach((point, i) => {
            const x = padding + (chartWidth / (dataPoints.length - 1)) * i;
            const y = padding + chartHeight - ((point.roll1 - minValue) / (maxValue - minValue)) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Roll 2 (Red)
        ctx.strokeStyle = '#e74c3c';
        ctx.beginPath();
        dataPoints.forEach((point, i) => {
            const x = padding + (chartWidth / (dataPoints.length - 1)) * i;
            const y = padding + chartHeight - ((point.roll2 - minValue) / (maxValue - minValue)) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        for (let i = 0; i <= 5; i++) {
            const value = minValue + (maxValue - minValue) * (i / 5);
            const y = padding + chartHeight - (chartHeight / 5) * i;
            ctx.fillText(Math.round(value), padding - 30, y + 5);
        }

        // Legend
        ctx.fillStyle = '#3498db';
        ctx.fillRect(canvas.width - 150, 10, 15, 15);
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.fillText('Roll 1', canvas.width - 130, 22);

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(canvas.width - 150, 30, 15, 15);
        ctx.fillStyle = '#333';
        ctx.fillText('Roll 2', canvas.width - 130, 42);

        // Render summary
        const trendAnalysis = this.analyzeTrendDirection();
        const summary = `
            <div class="analysis-point">
                <strong>Tren Angka (${recent.length} game terakhir):</strong><br>
                Naik: ${trendAnalysis.upCount} | Turun: ${trendAnalysis.downCount} | Stabil: ${trendAnalysis.stableCount}
            </div>
            <div class="analysis-point">
                <strong>Dominasi:</strong> <span class="${this.getTrendClass(this.getTrendDominant().includes('↑') ? 'naik' : this.getTrendDominant().includes('↓') ? 'turun' : 'stabil')}">${this.getTrendDominant()}</span>
            </div>
        `;
        document.getElementById('trendSummary').innerHTML = summary;
    }

    renderTransitionMatrix() {
        const matrix = this.buildTransitionMatrix();
        const container = document.getElementById('transitionMatrix');

        if (!matrix || this.games.length < 2) {
            container.innerHTML = '<p class="empty-state">Data belum cukup untuk analisis transisi</p>';
            return;
        }

        const states = ['LOW', 'MID', 'HIGH', 'EXTREME'];
        let html = '';

        // Header row
        html += '<div class="matrix-row">';
        html += '<div class="matrix-cell matrix-header">State</div>';
        states.forEach(state => {
            html += `<div class="matrix-cell matrix-header">${state}</div>`;
        });
        html += '</div>';

        // Data rows
        states.forEach(fromState => {
            html += '<div class="matrix-row">';
            html += `<div class="matrix-cell matrix-header">${fromState}</div>`;

            const probability = this.getStateTransitionProbability(fromState);
            if (probability) {
                states.forEach(toState => {
                    const percent = probability[toState];
                    const intensity = percent / 100;
                    const bgColor = `rgba(102, 126, 234, ${intensity * 0.6})`;
                    html += `<div class="matrix-cell matrix-data" style="background-color: ${bgColor};">${percent}%</div>`;
                });
            } else {
                states.forEach(() => {
                    html += '<div class="matrix-cell matrix-data">-</div>';
                });
            }

            html += '</div>';
        });

        container.innerHTML = html;
    }

    renderPrediction() {
        const prediction = this.predictNextOutcome();
        const container = document.getElementById('predictionOutput');
        const basisContainer = document.getElementById('analysisBasis');

        if (!prediction.canPredict) {
            container.innerHTML = `<p class="empty-state">${prediction.reason}</p>`;
            basisContainer.innerHTML = '<p class="empty-state">Dasar analisis akan ditampilkan setelah prediksi</p>';
            return;
        }

        const { KECIL, BESAR, reasoning } = prediction;
        const dominantClass = KECIL > BESAR ? 'prediction-kecil' : 'prediction-besar';
        const dominantLabel = KECIL > BESAR ? 'KECIL' : 'BESAR';

        // Prediction output
        container.innerHTML = `
            <div class="prediction-item prediction-kecil">
                <span class="prediction-label">KECIL</span>
                <span class="prediction-percentage">${KECIL}%</span>
                <span class="prediction-small">Kemungkinan</span>
            </div>
            <div class="prediction-item prediction-besar">
                <span class="prediction-label">BESAR</span>
                <span class="prediction-percentage">${BESAR}%</span>
                <span class="prediction-small">Kemungkinan</span>
            </div>
        `;

        // Analysis basis
        const basisHTML = `
            <div class="analysis-point">
                <strong>🎯 Rekomendasi:</strong> ${dominantLabel} (${Math.max(KECIL, BESAR)}% confidence)
            </div>
            <div class="analysis-point">
                <strong>📊 Komponen Analisis:</strong>
                <ul>
                    <li><strong>Tren Numerik:</strong> ${reasoning.trendDirection.upCount} Naik, ${reasoning.trendDirection.downCount} Turun, ${reasoning.trendDirection.stableCount} Stabil → ${reasoning.trendDirection.downCount > reasoning.trendDirection.upCount ? 'Cenderung menurun (KECIL)' : 'Cenderung meningkat (BESAR)'}</li>
                    <li><strong>Dominasi State:</strong> LOW: ${reasoning.stateDominance.LOW}, MID: ${reasoning.stateDominance.MID}, HIGH: ${reasoning.stateDominance.HIGH}, EXTREME: ${reasoning.stateDominance.EXTREME}</li>
                    <li><strong>State Terakhir:</strong> ${reasoning.lastState}</li>
                    <li><strong>Rata-rata Roll 2:</strong> ${reasoning.avgRoll2} (Pusat K/B: 30) → ${reasoning.avgRoll2 < 30 ? 'Lebih dekat KECIL' : 'Lebih dekat BESAR'}</li>
                    <li><strong>Transisi dari ${reasoning.lastState}:</strong>
                        ${reasoning.stateTransitionProb ? `
                            LOW: ${reasoning.stateTransitionProb.LOW || 0}%, 
                            MID: ${reasoning.stateTransitionProb.MID || 0}%, 
                            HIGH: ${reasoning.stateTransitionProb.HIGH || 0}%, 
                            EXTREME: ${reasoning.stateTransitionProb.EXTREME || 0}%
                        ` : 'Data belum cukup'}
                    </li>
                </ul>
            </div>
            <div class="analysis-point">
                <strong>⚙️ Metodologi:</strong> Hybrid Scoring System (Numeric Trend 25% + State Dominance 30% + State Transition 25% + Distance from Center 20%)
            </div>
        `;

        basisContainer.innerHTML = basisHTML;
    }
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    new DiceAnalysisSystem();
});