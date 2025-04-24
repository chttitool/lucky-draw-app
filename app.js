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
    
    // ===== 狀態變數 =====
    let prizes = []; // 獎項清單 [{name, quantity, remaining}]
    let participants = []; // 參加者清單
    let eligibleParticipants = []; // 當前可抽名單
    let winners = {}; // 各獎項得獎者 {獎項名稱: [名字,...]}
    let absentParticipants = []; // 不在場名單
    let currentPrizeIndex = 0; // 當前獎項索引
    let currentPrizeRemaining = 0; // 當前獎項剩餘數量
    let isDrawing = false; // 是否正在抽獎動畫中
    let timer = null; // 抽獎動畫計時器
    let drawingSpeed = 30; // 抽獎動畫速度 (ms)
    let drawingDuration = 1000; // 抽獎動畫總時長 (ms)
    const originalNames = []; // 原始參加者名單
    let currentPrizeAbsentWinners = []; // 當前獎項不在場的中獎者
    
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
        prizesInput.classList.add('is-invalid');
        prizesFeedback.textContent = message;
    }
    // 設定獎項輸入為有效狀態
    function setPrizesValid() {
        prizesInput.classList.remove('is-invalid');
    }
    // 設定參加者輸入為無效狀態
    function setParticipantsInvalid(message) {
        participantsInput.classList.add('is-invalid');
        participantsFeedback.textContent = message;
    }
    // 設定參加者輸入為有效狀態
    function setParticipantsValid() {
        participantsInput.classList.remove('is-invalid');
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
        prizes = [];
        
        for (const line of prizeLines) {
            const [name, quantity] = line.split(':');
            prizes.push({
                name: name.trim(),
                quantity: parseInt(quantity),
                remaining: parseInt(quantity)
            });
        }
        
        // 解析參加者
        const participantText = participantsInput.value.trim();
        const participantLines = participantText.split('\n').filter(line => line.trim() !== '');
        participants = participantLines.map(name => name.trim());
        originalNames.length = 0; // 清空原始名單
        originalNames.push(...participants); // 儲存原始名單
        
        // 重設狀態
        eligibleParticipants = [...participants];
        winners = {};
        absentParticipants = [];
        currentPrizeIndex = 0;
        currentPrizeAbsentWinners = [];
        
        // 清空 UI
        currentPrizeWinners.innerHTML = '';
        currentPrizeAbsent.innerHTML = '';
        
        // 設定第一個獎項
        setCurrentPrize();
        
        // 顯示抽獎區塊動畫
        setupSection.classList.add('animate__fadeOutUp');
        setTimeout(() => {
            setupSection.classList.add('d-none');
            drawingSection.classList.remove('d-none');
            drawingSection.classList.add('animate__fadeInUp');
        }, 500);
    }
    
    // 設定目前抽的獎項
    function setCurrentPrize() {
        const prize = prizes[currentPrizeIndex];
        currentPrize.textContent = prize.name;
        currentPrizeRemaining = prize.remaining;
        remainingCount.textContent = currentPrizeRemaining;
    }
    
    // 執行抽獎動畫與選出得獎者
    function draw() {
        if (isDrawing) return;
        
        if (eligibleParticipants.length === 0) {
            alert('沒有足夠的參加者進行抽獎');
            return;
        }
        
        isDrawing = true;
        drawBtn.disabled = true;
        winnerConfirmation.classList.add('d-none');
        
        // 開始動畫 (快速輪播名字)
        let count = 0;
        const maxIterations = drawingDuration / drawingSpeed;
        
        timer = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
            drawingName.textContent = eligibleParticipants[randomIndex];
            drawingName.classList.add('name-animation');
            
            count++;
            if (count >= maxIterations) {
                clearInterval(timer);
                selectWinner();
            }
        }, drawingSpeed);
    }
    
    // 選出得獎者並顯示確認
    function selectWinner() {
        // 隨機選一位得獎者
        const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
        const winner = eligibleParticipants[randomIndex];
        
        // 暫時從可抽名單移除 (待確認)
        eligibleParticipants.splice(randomIndex, 1);
        
        // 顯示得獎者
        drawingName.textContent = winner;
        drawingName.classList.add('draw-animation');
        
        // 顯示確認按鈕
        setTimeout(() => {
            const prize = prizes[currentPrizeIndex];
            winnerName.textContent = winner;
            winnerPrize.textContent = prize.name;
            winnerConfirmation.classList.remove('d-none');
            winnerConfirmation.classList.add('winner-appear');
            isDrawing = false;
        }, 500);
    }
    
    // 處理得獎者是否在場
    function handleWinnerPresence(isPresent) {
        const winner = winnerName.textContent;
        const prize = prizes[currentPrizeIndex];
        
        if (isPresent) {
            // 加入在場得獎者清單
            if (!winners[prize.name]) {
                winners[prize.name] = [];
            }
            winners[prize.name].push(winner);
            
            // 減少剩餘數量
            prize.remaining--;
            currentPrizeRemaining = prize.remaining;
            remainingCount.textContent = currentPrizeRemaining;
            
            // UI 顯示在場得獎者
            const winnerItem = document.createElement('div');
            winnerItem.classList.add('winner-item', 'animate__animated', 'animate__fadeIn');
            winnerItem.innerHTML = `<strong>${winner}</strong>`;
            currentPrizeWinners.appendChild(winnerItem);
        } else {
            // 加入不在場清單
            absentParticipants.push(winner);
            // 加入當前獎項不在場得獎者
            currentPrizeAbsentWinners.push(winner);
            // UI 顯示不在場得獎者
            const absentItem = document.createElement('div');
            absentItem.classList.add('prize-item', 'text-muted', 'animate__animated', 'animate__fadeIn');
            absentItem.innerHTML = `<strong>${winner}</strong>`;
            currentPrizeAbsent.appendChild(absentItem);
            // 從參加者移除，未來不再抽到
            const index = participants.indexOf(winner);
            if (index !== -1) {
                participants.splice(index, 1);
            }
        }
        
        // 重設 UI，準備下次抽獎
        winnerConfirmation.classList.add('d-none');
        drawBtn.disabled = false;
        drawingName.classList.remove('draw-animation');
        drawingName.textContent = '點擊抽獎按鈕';
        
        // 檢查是否換獎項或結束
        checkDrawingProgress();
    }
    
    // 檢查是否要換獎項或結束抽獎
    function checkDrawingProgress() {
        const currentPrize = prizes[currentPrizeIndex];
        
        // 當前獎項抽完
        if (currentPrize.remaining <= 0) {
            currentPrizeIndex++;
            // 所有獎項抽完
            if (currentPrizeIndex >= prizes.length) {
                finishDrawing();
                return;
            }
            // 換下一個獎項
            setCurrentPrize();
            // 重設可抽名單
            eligibleParticipants = [...participants];
            // 清空 UI
            currentPrizeWinners.innerHTML = '';
            currentPrizeAbsent.innerHTML = '';
            currentPrizeAbsentWinners = [];
        }
    }
    
    // 結束抽獎，顯示最終結果
    function finishDrawing() {
        // 結果區塊動畫
        drawingSection.classList.add('animate__fadeOutUp');
        setTimeout(() => {
            drawingSection.classList.add('d-none');
            displayFinalResults();
            resultsSection.classList.remove('d-none');
            resultsSection.classList.add('animate__fadeInUp');
        }, 500);
    }
    
    // 顯示最終中獎名單與不在場名單
    function displayFinalResults() {
        winnersList.innerHTML = '';
        // 依獎項顯示得獎者
        prizes.forEach(prize => {
            const prizeWinners = winners[prize.name] || [];
            if (prizeWinners.length > 0) {
                const prizeHeader = document.createElement('h4');
                prizeHeader.className = 'mt-3 mb-2';
                prizeHeader.textContent = prize.name;
                winnersList.appendChild(prizeHeader);
                prizeWinners.forEach(winner => {
                    const winnerItem = document.createElement('div');
                    winnerItem.className = 'winner-item';
                    winnerItem.innerHTML = `<strong>${winner}</strong>`;
                    winnersList.appendChild(winnerItem);
                });
            }
        });
        // 顯示不在場名單
        if (absentParticipants.length > 0) {
            const absentHeader = document.createElement('h4');
            absentHeader.className = 'mt-4 mb-2 text-muted';
            absentHeader.textContent = '未在場參加者';
            winnersList.appendChild(absentHeader);
            absentParticipants.forEach(absent => {
                const absentItem = document.createElement('div');
                absentItem.className = 'prize-item text-muted';
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
        prizes = [];
        participants = [];
        eligibleParticipants = [];
        winners = {};
        absentParticipants = [];
        currentPrizeIndex = 0;
        currentPrizeAbsentWinners = [];
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
            resultsSection.classList.add('d-none');
            setupSection.classList.remove('d-none', 'animate__fadeOutUp');
            setupSection.classList.add('animate__fadeInUp');
        }, 500);
    }
});