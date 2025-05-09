// 主程式進入點，等待 DOM 載入完成
// filepath: c:\Users\terry\Documents\抽獎程式\app.js
document.addEventListener('DOMContentLoaded', function() {
    // ===== DOM 元素取得 =====
    const setupSection = document.getElementById('setup-section'); // 設定區塊
    const drawingSection = document.getElementById('drawing-section'); // 抽獎區塊
    const resultsSection = document.getElementById('results-section'); // 結果區塊
    
    const prizesInput = document.getElementById('prizes-input'); // 獎項輸入框
    const participantsInput = document.getElementById('participants-input'); // 參加者輸入框
    const prizesFeedback = document.getElementById('prizes-feedback'); // 獎項格式錯誤提示
    const participantsFeedback = document.getElementById('participants-feedback'); // 參加者格式錯誤提示
    
    const startDrawingBtn = document.getElementById('start-drawing-btn'); // 開始抽獎按鈕
    const drawBtn = document.getElementById('draw-btn'); // 抽獎按鈕
    const resetBtn = document.getElementById('reset-btn'); // 重新開始按鈕
    
    const currentPrize = document.getElementById('current-prize'); // 當前獎項名稱
    const remainingCount = document.getElementById('remaining-count'); // 當前獎項剩餘數量
    const drawingName = document.getElementById('drawing-name'); // 抽獎動畫顯示名字
    const winnerConfirmation = document.getElementById('winner-confirmation'); // 得獎者確認區塊
    const winnerName = document.getElementById('winner-name'); // 得獎者名字
    const winnerPrize = document.getElementById('winner-prize'); // 得獎者獎項
    const winnerPresentBtn = document.getElementById('winner-present-btn'); // 在場按鈕
    const winnerAbsentBtn = document.getElementById('winner-absent-btn'); // 不在場按鈕
    const winnersList = document.getElementById('winners-list'); // 最終中獎名單區
    const currentPrizeWinners = document.getElementById('current-prize-winners'); // 當前獎項在場得獎者
    const currentPrizeAbsent = document.getElementById('current-prize-absent'); // 當前獎項不在場得獎者
    
    // ===== 狀態集中管理 =====
    // 將所有狀態變數集中於 state 物件，方便管理
    const state = {
        prizes: [], // 獎項清單 [{name, quantity, remaining}]
        participants: [], // 參加者清單
        eligibleParticipants: [], // 當前可抽名單
        winners: {}, // 各獎項得獎者 {獎項名稱: [名字,...]}
        absentParticipants: [], // 不在場名單
        currentPrizeIndex: 0, // 當前獎項索引
        currentPrizeRemaining: 0, // 當前獎項剩餘數量
        isDrawing: false, // 是否正在抽獎動畫中
        timer: null, // 抽獎動畫計時器
        drawingSpeed: 30, // 抽獎動畫速度 (ms)
        drawingDuration: 1000, // 抽獎動畫總時長 (ms)
        originalNames: [], // 原始參加者名單
        currentPrizeAbsentWinners: [] // 當前獎項不在場的中獎者
    };

    // ===== 工具函式：顯示/隱藏元素，減少重複 =====
    function showElement(el) {
        el.classList.remove('d-none', 'hidden');
    }
    function hideElement(el) {
        el.classList.add('d-none', 'hidden');
    }

    // ===== 事件監聽 =====
    startDrawingBtn.addEventListener('click', startDrawing); // 開始抽獎
    drawBtn.addEventListener('click', draw); // 抽獎
    resetBtn.addEventListener('click', reset); // 重新開始
    winnerPresentBtn.addEventListener('click', () => handleWinnerPresence(true)); // 得獎者在場
    winnerAbsentBtn.addEventListener('click', () => handleWinnerPresence(false)); // 得獎者不在場
    
    // 輸入驗證
    prizesInput.addEventListener('input', validatePrizes);
    participantsInput.addEventListener('input', validateParticipants);
    
    // ====== 功能函式區 ======
    // 驗證獎項格式 (每行: 名稱:數量)
    function validatePrizes() {
        const prizeText = prizesInput.value.trim();
        if (!prizeText) {
            setPrizesInvalid('請輸入獎項');
            return false;
        }
        
        const lines = prizeText.split('\n').filter(line => line.trim() !== '');
        const prizeRegex = /^(.+?):(\d+)$/;
        const parsedPrizes = [];
        let isValid = true;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(prizeRegex);
            
            if (!match) {
                setPrizesInvalid(`第 ${i + 1} 行格式錯誤，請使用 "獎項名稱:數量" 格式`);
                isValid = false;
                break;
            }
            
            const name = match[1].trim();
            const quantity = parseInt(match[2]);
            
            if (quantity <= 0) {
                setPrizesInvalid(`第 ${i + 1} 行獎項數量必須大於 0`);
                isValid = false;
                break;
            }
            
            parsedPrizes.push({ name, quantity, remaining: quantity });
        }
        
        if (isValid) {
            setPrizesValid();
            return true;
        }
        
        return false;
    }
    
    // 驗證參加者名單 (每行一人，不可重複)
    function validateParticipants() {
        const participantText = participantsInput.value.trim();
        if (!participantText) {
            setParticipantsInvalid('請輸入參加者名單');
            return false;
        }
        
        const lines = participantText.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            setParticipantsInvalid('請輸入至少一位參加者');
            return false;
        }
        
        // 檢查是否有重複的名字
        const uniqueNames = new Set(lines.map(name => name.trim()));
        if (uniqueNames.size !== lines.length) {
            setParticipantsInvalid('參加者名單中有重複的名字');
            return false;
        }
        
        setParticipantsValid();
        return true;
    }
    
    // 設定獎項輸入為無效狀態
    function setPrizesInvalid(message) {
        prizesInput.classList.add('border-red-500', 'focus:ring-red-400');
        prizesFeedback.textContent = message;
    }
    // 設定獎項輸入為有效狀態
    function setPrizesValid() {
        prizesInput.classList.remove('border-red-500', 'focus:ring-red-400');
        prizesFeedback.textContent = '';
    }
    // 設定參加者輸入為無效狀態
    function setParticipantsInvalid(message) {
        participantsInput.classList.add('border-red-500', 'focus:ring-red-400');
        participantsFeedback.textContent = message;
    }
    // 設定參加者輸入為有效狀態
    function setParticipantsValid() {
        participantsInput.classList.remove('border-red-500', 'focus:ring-red-400');
        participantsFeedback.textContent = '';
    }
    
    // ====== 抽獎流程 ======
    // 開始抽獎，初始化所有狀態
    function startDrawing() {
        if (!validatePrizes() || !validateParticipants()) {
            return;
        }
        
        // 解析獎項
        const prizeText = prizesInput.value.trim();
        const prizeLines = prizeText.split('\n').filter(line => line.trim() !== '');
        state.prizes = [];
        
        for (const line of prizeLines) {
            const [name, quantity] = line.split(':');
            state.prizes.push({
                name: name.trim(),
                quantity: parseInt(quantity),
                remaining: parseInt(quantity)
            });
        }
        
        // 解析參加者
        const participantText = participantsInput.value.trim();
        const participantLines = participantText.split('\n').filter(line => line.trim() !== '');
        state.participants = participantLines.map(name => name.trim());
        state.originalNames.length = 0; // 清空原始名單
        state.originalNames.push(...state.participants); // 儲存原始名單
        
        // 重設狀態
        state.eligibleParticipants = [...state.participants];
        state.winners = {};
        state.absentParticipants = [];
        state.currentPrizeIndex = 0;
        state.currentPrizeAbsentWinners = [];
        
        // 清空 UI
        currentPrizeWinners.innerHTML = '';
        currentPrizeAbsent.innerHTML = '';
        hideElement(winnerConfirmation); // 隱藏確認視窗
        
        // 設定第一個獎項
        setCurrentPrize();
        
        // 顯示抽獎區塊動畫
        setupSection.classList.add('animate__fadeOutUp');
        setTimeout(() => {
            setupSection.classList.add('hidden');
            drawingSection.classList.remove('hidden');
            drawingSection.classList.add('animate__fadeInUp');
        }, 500);
    }
    
    // 設定目前抽的獎項
    function setCurrentPrize() {
        const prize = state.prizes[state.currentPrizeIndex];
        currentPrize.textContent = prize.name;
        state.currentPrizeRemaining = prize.remaining;
        remainingCount.textContent = state.currentPrizeRemaining;
    }
    
    // 執行抽獎動畫與選出得獎者
    function draw() {
        if (state.isDrawing) return;
        
        if (state.eligibleParticipants.length === 0) {
            alert('沒有足夠的參加者進行抽獎');
            return;
        }
        
        state.isDrawing = true;
        drawBtn.disabled = true;
        hideElement(winnerConfirmation); // 抽獎前再次隱藏
        
        // 開始動畫 (快速輪播名字)
        let count = 0;
        const maxIterations = state.drawingDuration / state.drawingSpeed;
        
        state.timer = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * state.eligibleParticipants.length);
            drawingName.textContent = state.eligibleParticipants[randomIndex];
            drawingName.classList.add('name-animation');
            
            count++;
            if (count >= maxIterations) {
                clearInterval(state.timer);
                selectWinner();
            }
        }, state.drawingSpeed);
    }
    
    // 選出得獎者並顯示確認
    function selectWinner() {
        // 隨機選一位得獎者
        const randomIndex = Math.floor(Math.random() * state.eligibleParticipants.length);
        const winner = state.eligibleParticipants[randomIndex];
        
        // 暫時從可抽名單移除 (待確認)
        state.eligibleParticipants.splice(randomIndex, 1);
        
        // 顯示得獎者
        drawingName.textContent = winner;
        drawingName.classList.add('draw-animation');
        
        // 顯示確認按鈕
        setTimeout(() => {
            const prize = state.prizes[state.currentPrizeIndex];
            winnerName.textContent = winner;
            winnerPrize.textContent = prize.name;
            showElement(winnerConfirmation); // 顯示確認視窗
            winnerConfirmation.classList.add('winner-appear');
            state.isDrawing = false;
            winnerPresentBtn.disabled = false;
            winnerAbsentBtn.disabled = false;
        }, 500);
    }
    
    // 處理得獎者是否在場
    function handleWinnerPresence(isPresent) {
        const winner = winnerName.textContent;
        const prize = state.prizes[state.currentPrizeIndex];
        
        if (isPresent) {
            // 加入在場得獎者清單
            if (!state.winners[prize.name]) {
                state.winners[prize.name] = [];
            }
            state.winners[prize.name].push(winner);
            
            // 減少剩餘數量
            prize.remaining--;
            state.currentPrizeRemaining = prize.remaining;
            remainingCount.textContent = state.currentPrizeRemaining;

            // 將得獎者從所有可抽名單中移除，確保每人僅能中獎一次
            const idx1 = state.participants.indexOf(winner);
            if (idx1 !== -1) state.participants.splice(idx1, 1);
            const idx2 = state.eligibleParticipants.indexOf(winner);
            if (idx2 !== -1) state.eligibleParticipants.splice(idx2, 1);
            
            // UI 顯示在場得獎者
            const winnerItem = document.createElement('div');
            winnerItem.classList.add('winner-item', 'animate__animated', 'animate__fadeIn', 'bg-green-50', 'rounded', 'px-3', 'py-2', 'mb-2', 'text-green-800', 'font-semibold');
            winnerItem.innerHTML = `<strong>${winner}</strong>`;
            currentPrizeWinners.appendChild(winnerItem);
        } else {
            // 加入不在場清單
            state.absentParticipants.push(winner);
            // 加入當前獎項不在場得獎者
            state.currentPrizeAbsentWinners.push(winner);
            // UI 顯示不在場得獎者
            const absentItem = document.createElement('div');
            absentItem.classList.add('prize-item', 'animate__animated', 'animate__fadeIn', 'bg-red-50', 'rounded', 'px-3', 'py-2', 'mb-2', 'text-red-800', 'font-semibold');
            absentItem.innerHTML = `<strong>${winner}</strong>`;
            currentPrizeAbsent.appendChild(absentItem);
            // 從參加者移除，未來不再抽到
            const index = state.participants.indexOf(winner);
            if (index !== -1) {
                state.participants.splice(index, 1);
            }
        }
        
        // 重設 UI，準備下次抽獎
        hideElement(winnerConfirmation); // 按下後立即關閉確認視窗
        winnerPresentBtn.disabled = true;
        winnerAbsentBtn.disabled = true;
        drawBtn.disabled = false;
        drawingName.classList.remove('draw-animation');
        drawingName.textContent = '點擊抽獎按鈕';
        
        // 檢查是否換獎項或結束
        checkDrawingProgress();
    }
    
    // 檢查是否要換獎項或結束抽獎
    function checkDrawingProgress() {
        const currentPrize = state.prizes[state.currentPrizeIndex];
        
        // 當前獎項抽完
        if (currentPrize.remaining <= 0) {
            state.currentPrizeIndex++;
            // 所有獎項抽完
            if (state.currentPrizeIndex >= state.prizes.length) {
                finishDrawing();
                return;
            }
            // 換下一個獎項
            setCurrentPrize();
            // 重設可抽名單
            state.eligibleParticipants = [...state.participants];
            // 清空 UI
            currentPrizeWinners.innerHTML = '';
            currentPrizeAbsent.innerHTML = '';
            state.currentPrizeAbsentWinners = [];
        }
    }
    
    // 結束抽獎，顯示最終結果
    function finishDrawing() {
        // 結果區塊動畫
        drawingSection.classList.add('animate__fadeOutUp');
        setTimeout(() => {
            drawingSection.classList.add('hidden');
            displayFinalResults();
            resultsSection.classList.remove('hidden');
            resultsSection.classList.add('animate__fadeInUp');
        }, 500);
    }
    
    // 顯示最終中獎名單與不在場名單
    function displayFinalResults() {
        winnersList.innerHTML = '';
        // 依獎項顯示得獎者
        state.prizes.forEach(prize => {
            const prizeWinners = state.winners[prize.name] || [];
            if (prizeWinners.length > 0) {
                const prizeHeader = document.createElement('h4');
                prizeHeader.className = 'mt-3 mb-2 font-bold text-lg text-blue-700';
                prizeHeader.textContent = prize.name;
                winnersList.appendChild(prizeHeader);
                prizeWinners.forEach(winner => {
                    const winnerItem = document.createElement('div');
                    winnerItem.className = 'winner-item bg-green-50 rounded px-3 py-2 mb-2 text-green-800 font-semibold';
                    winnerItem.innerHTML = `<strong>${winner}</strong>`;
                    winnersList.appendChild(winnerItem);
                });
            }
        });
        // 顯示不在場名單
        if (state.absentParticipants.length > 0) {
            const absentHeader = document.createElement('h4');
            absentHeader.className = 'mt-4 mb-2 text-red-600 font-bold';
            absentHeader.textContent = '未在場參加者';
            winnersList.appendChild(absentHeader);
            state.absentParticipants.forEach(absent => {
                const absentItem = document.createElement('div');
                absentItem.className = 'prize-item bg-red-50 rounded px-3 py-2 mb-2 text-red-800 font-semibold';
                absentItem.innerHTML = `<strong>${absent}</strong>`;
                winnersList.appendChild(absentItem);
            });
        }
    }
    
    // 重新開始，重設所有狀態與 UI
    function reset() {
        // 清空輸入
        prizesInput.value = '';
        participantsInput.value = '';
        // 重設狀態
        state.prizes = [];
        state.participants = [];
        state.eligibleParticipants = [];
        state.winners = {};
        state.absentParticipants = [];
        state.currentPrizeIndex = 0;
        state.currentPrizeAbsentWinners = [];
        // 重設 UI
        winnersList.innerHTML = '';
        currentPrizeWinners.innerHTML = '';
        currentPrizeAbsent.innerHTML = '';
        drawingName.textContent = '準備開始...';
        setPrizesValid();
        setParticipantsValid();
        // 顯示設定區塊動畫
        resultsSection.classList.add('animate__fadeOutUp');
        setTimeout(() => {
            resultsSection.classList.add('hidden');
            setupSection.classList.remove('hidden', 'animate__fadeOutUp');
            setupSection.classList.add('animate__fadeInUp');
        }, 500);
    }
});