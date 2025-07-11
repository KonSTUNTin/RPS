// Состояние игры
let gameState = {
    phase: 'selecting', // 'selecting', 'reveal', 'result'
    playerHealth: 10,
    enemyHealth: 10,
    playerChoice: null,
    playerActiveBuffs: [], // Массив активных баффов с длительностью
    enemyChoice: null,
    enemyActiveBuffs: [], // Массив активных баффов врага с длительностью
    blockedChoices: [],
    round: 1
  };
  
  // Данные игры
  const choices = ['rock', 'paper', 'scissors'];
  const choiceEmojis = { rock: '✊', paper: '✋', scissors: '✌️' };
  const choiceNames = { rock: 'Камень', paper: 'Бумага', scissors: 'Ножницы' };
  
  const buffs = {
    block: { 
        name: 'Блок', 
        description: 'Блокирует один случайный выбор противника в следующем раунде. Враг не сможет использовать заблокированное действие.',
        duration: 1
    },
    tie_damage: { 
        name: 'Ничья+', 
        description: 'При ничейном результате вы наносите 1 урон противнику. Превращает ничью в ваше преимущество.',
        duration: 2
    },
    chaos: { 
        name: 'Хаос', 
        description: 'Рандомизирует выборы обеих сторон. Никто не знает, что получится - полная случайность!',
        duration: 1
    },
    double: { 
        name: 'x2', 
        description: 'При победе наносите двойной урон (2 вместо 1). Мощная атака для решающего удара.',
        duration: 3
    },
    counter: { 
        name: 'Контр', 
        description: 'При поражении наносите 1 урон противнику. Даже проигрывая, вы не остаетесь без ответа.',
        duration: 2
    },
    shield: { 
        name: 'Щит', 
        description: 'Уменьшает получаемый урон на 1 (минимум 0). Надежная защита от атак противника.',
        duration: 3
    },
    rage: { 
        name: 'Ярость', 
        description: 'Увеличивает наносимый урон на 1. Ваши атаки становятся более разрушительными.',
        duration: 2
    }
  };
  
  // Переменные для попапа
  let selectedBuffForPopup = null;
  
  // Элементы DOM
  const elements = {
    roundNumber: document.getElementById('round-number'),
    playerHealth: document.getElementById('player-health'),
    enemyHealth: document.getElementById('enemy-health'),
    playerChoice: document.getElementById('player-choice'),
    enemyChoice: document.getElementById('enemy-choice'),
    resultSection: document.getElementById('result-section'),
    resultText: document.getElementById('result-text'),
    resultDetails: document.getElementById('result-details'),
    gameInterface: document.getElementById('game-interface'),
    nextRoundBtn: document.getElementById('next-round-btn'),
    gameOver: document.getElementById('game-over'),
    gameOverTitle: document.getElementById('game-over-title'),
    makeMoveBtn: document.getElementById('make-move-btn'),
    blockedChoices: document.getElementById('blocked-choices'),
    popupOverlay: document.getElementById('popup-overlay'),
    popupClose: document.getElementById('popup-close'),
    popupTitle: document.getElementById('popup-title'),
    popupDescription: document.getElementById('popup-description'),
    popupApplyBtn: document.getElementById('popup-apply-btn')
  };
  
  // Функция для добавления баффа
  function addBuff(target, buffType) {
    const buff = {
        type: buffType,
        duration: buffs[buffType].duration
    };
    
    if (target === 'player') {
        // Проверяем, есть ли уже такой бафф
        const existingBuff = gameState.playerActiveBuffs.find(b => b.type === buffType);
        if (existingBuff) {
            existingBuff.duration = buffs[buffType].duration; // Обновляем длительность
        } else {
            gameState.playerActiveBuffs.push(buff);
        }
    } else {
        const existingBuff = gameState.enemyActiveBuffs.find(b => b.type === buffType);
        if (existingBuff) {
            existingBuff.duration = buffs[buffType].duration;
        } else {
            gameState.enemyActiveBuffs.push(buff);
        }
    }
  }
  
  // Функция для уменьшения длительности баффов
  function decreaseBuffDuration() {
    gameState.playerActiveBuffs = gameState.playerActiveBuffs.filter(buff => {
        buff.duration--;
        return buff.duration > 0;
    });
    
    gameState.enemyActiveBuffs = gameState.enemyActiveBuffs.filter(buff => {
        buff.duration--;
        return buff.duration > 0;
    });
  }
  
  // Функция для проверки наличия баффа
  function hasBuff(target, buffType) {
    const buffs = target === 'player' ? gameState.playerActiveBuffs : gameState.enemyActiveBuffs;
    return buffs.some(buff => buff.type === buffType);
  }
  
  // Функция для отображения активных баффов
  function updateActiveBuffsDisplay() {
    const playerBuffsContainer = document.getElementById('player-active-buffs');
    const enemyBuffsContainer = document.getElementById('enemy-active-buffs');
    
    if (!playerBuffsContainer || !enemyBuffsContainer) return;
    
    // Очищаем контейнеры
    playerBuffsContainer.innerHTML = '';
    enemyBuffsContainer.innerHTML = '';
    
    // Отображаем баффы игрока
    gameState.playerActiveBuffs.forEach(buff => {
        const buffElement = document.createElement('div');
        buffElement.className = 'active-buff';
        buffElement.innerHTML = `
            <span class="buff-name">${buffs[buff.type].name}</span>
            <span class="buff-duration">${buff.duration}</span>
        `;
        playerBuffsContainer.appendChild(buffElement);
    });
    
    // Отображаем баффы врага
    gameState.enemyActiveBuffs.forEach(buff => {
        const buffElement = document.createElement('div');
        buffElement.className = 'active-buff';
        buffElement.innerHTML = `
            <span class="buff-name">${buffs[buff.type].name}</span>
            <span class="buff-duration">${buff.duration}</span>
        `;
        enemyBuffsContainer.appendChild(buffElement);
    });
  }
  
  // Инициализация
  function init() {
    updateHealthBars();
    updateRoundNumber();
    setupEventListeners();
    updateBlockedChoices();
    updateActiveBuffsDisplay();
    updateDisplay();
  }
  
  // Обновление полосок здоровья
  function updateHealthBars() {
    // Здоровье игрока
    elements.playerHealth.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const healthPoint = document.createElement('div');
        healthPoint.className = `health-point ${i < gameState.playerHealth ? 'health-full' : 'health-empty'}`;
        elements.playerHealth.appendChild(healthPoint);
    }
  
    // Здоровье врага
    elements.enemyHealth.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const healthPoint = document.createElement('div');
        healthPoint.className = `health-point ${i < gameState.enemyHealth ? 'health-full' : 'health-empty'}`;
        elements.enemyHealth.appendChild(healthPoint);
    }
  }
  
  // Обновление номера раунда
  function updateRoundNumber() {
    elements.roundNumber.textContent = gameState.round;
  }
  
  // Настройка слушателей событий
  function setupEventListeners() {
    // Выбор действий
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const choice = e.target.dataset.choice;
            if (gameState.blockedChoices.includes(choice)) return;
            
            // Убираем выделение с других кнопок
            document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
            
            if (gameState.playerChoice === choice) {
                gameState.playerChoice = null;
            } else {
                gameState.playerChoice = choice;
                e.target.classList.add('selected');
            }
            updateMakeMoveButton();
        });
    });
  
    // Выбор баффов (открытие попапа)
    document.querySelectorAll('.buff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const buff = e.target.dataset.buff;
            selectedBuffForPopup = buff;
            showBuffPopup(buff);
        });
    });
  
    // Попап события
    elements.popupClose.addEventListener('click', hideBuffPopup);
    elements.popupOverlay.addEventListener('click', (e) => {
        if (e.target === elements.popupOverlay) {
            hideBuffPopup();
        }
    });
    elements.popupApplyBtn.addEventListener('click', applyBuffFromPopup);
  
    // Кнопка хода
    elements.makeMoveBtn.addEventListener('click', makeMove);
  
    // Кнопка следующего раунда
    elements.nextRoundBtn.addEventListener('click', nextRound);
  
    // Кнопка новой игры
    document.getElementById('new-game-btn').addEventListener('click', newGame);
  }
  
  // Показать попап баффа
  function showBuffPopup(buff) {
    elements.popupTitle.textContent = `${buffs[buff].name} (${buffs[buff].duration} ходов)`;
    elements.popupDescription.textContent = buffs[buff].description;
    elements.popupOverlay.classList.remove('hidden');
  }
  
  // Скрыть попап баффа
  function hideBuffPopup() {
    elements.popupOverlay.classList.add('hidden');
    selectedBuffForPopup = null;
  }
  
  // Применить бафф из попапа
  function applyBuffFromPopup() {
    if (selectedBuffForPopup) {
        addBuff('player', selectedBuffForPopup);
        updateActiveBuffsDisplay();
        hideBuffPopup();
    }
  }
  
  // Обновление кнопки хода
  function updateMakeMoveButton() {
    const canMove = gameState.playerChoice;
    elements.makeMoveBtn.disabled = !canMove;
  }
  
  // Сделать ход
  function makeMove() {
    gameState.phase = 'reveal';
    generateEnemyMove();
    updateDisplay();
    
    setTimeout(() => {
        calculateResult();
    }, 1500);
  }
  
  // Генерация хода врага
  function generateEnemyMove() {
    // Генерируем случайный выбор для врага
    gameState.enemyChoice = choices[Math.floor(Math.random() * choices.length)];
    
    // Генерируем случайный бафф для врага
    const randomBuff = Object.keys(buffs)[Math.floor(Math.random() * Object.keys(buffs).length)];
    addBuff('enemy', randomBuff);
  }
  
  // Определение победителя
  function getWinner(choice1, choice2) {
    if (choice1 === choice2) return 'tie';
    if (
        (choice1 === 'rock' && choice2 === 'scissors') ||
        (choice1 === 'paper' && choice2 === 'rock') ||
        (choice1 === 'scissors' && choice2 === 'paper')
    ) {
        return 'player';
    }
    return 'enemy';
  }
  
  // Расчет результата
  function calculateResult() {
    let finalPlayerChoice = gameState.playerChoice;
    let finalEnemyChoice = gameState.enemyChoice;
    let playerDamage = 0;
    let enemyDamage = 0;
    let resultText = '';
  
    // Применяем блок игрока - блокируем врага
    if (hasBuff('player', 'block')) {
        const blockedChoice = choices[Math.floor(Math.random() * choices.length)];
        if (finalEnemyChoice === blockedChoice) {
            // Заставляем врага выбрать другой вариант
            const availableChoices = choices.filter(choice => choice !== blockedChoice);
            finalEnemyChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
            resultText += `Блок заблокировал ${choiceNames[blockedChoice]} у врага! `;
        }
    }
  
    // Применяем блок врага - блокируем игрока в следующем раунде
    if (hasBuff('enemy', 'block')) {
        const blockedChoice = choices[Math.floor(Math.random() * choices.length)];
        gameState.blockedChoices = [blockedChoice];
        resultText += `Враг заблокирует ${choiceNames[blockedChoice]} в следующем раунде! `;
    }
  
    // Применяем хаос
    if (hasBuff('player', 'chaos') || hasBuff('enemy', 'chaos')) {
        finalPlayerChoice = choices[Math.floor(Math.random() * choices.length)];
        finalEnemyChoice = choices[Math.floor(Math.random() * choices.length)];
        resultText += 'Хаос изменил выборы! ';
    }
  
    const winner = getWinner(finalPlayerChoice, finalEnemyChoice);
    
    if (winner === 'tie') {
        resultText += 'Ничья! ';
        if (hasBuff('player', 'tie_damage')) {
            enemyDamage += 1;
            resultText += 'Ничья+ наносит урон врагу! ';
        }
        if (hasBuff('enemy', 'tie_damage')) {
            playerDamage += 1;
            resultText += 'Враг наносит урон при ничьей! ';
        }
    } else if (winner === 'player') {
        resultText += 'Вы победили! ';
        enemyDamage += 1;
        if (hasBuff('player', 'double')) {
            enemyDamage += 1;
            resultText += 'Двойной урон! ';
        }
        if (hasBuff('enemy', 'counter')) {
            playerDamage += 1;
            resultText += 'Контратака врага! ';
        }
    } else {
        resultText += 'Враг победил! ';
        playerDamage += 1;
        if (hasBuff('enemy', 'double')) {
            playerDamage += 1;
            resultText += 'Враг наносит двойной урон! ';
        }
        if (hasBuff('player', 'counter')) {
            enemyDamage += 1;
            resultText += 'Ваша контратака! ';
        }
    }
  
    // Применяем щиты
    if (hasBuff('player', 'shield') && playerDamage > 0) {
        playerDamage = Math.max(0, playerDamage - 1);
        resultText += 'Щит защитил вас! ';
    }
    if (hasBuff('enemy', 'shield') && enemyDamage > 0) {
        enemyDamage = Math.max(0, enemyDamage - 1);
        resultText += 'Щит защитил врага! ';
    }
  
    // Применяем ярость
    if (hasBuff('player', 'rage')) {
        enemyDamage += 1;
        resultText += 'Ярость увеличивает урон! ';
    }
    if (hasBuff('enemy', 'rage')) {
        playerDamage += 1;
        resultText += 'Ярость врага! ';
    }
  
    // Применяем урон
    gameState.playerHealth = Math.max(0, gameState.playerHealth - playerDamage);
    gameState.enemyHealth = Math.max(0, gameState.enemyHealth - enemyDamage);
  
    // Обновляем интерфейс
    elements.resultText.textContent = resultText;
    
    const playerBuffsText = gameState.playerActiveBuffs.map(b => buffs[b.type].name).join(', ') || 'Без усилений';
    const enemyBuffsText = gameState.enemyActiveBuffs.map(b => buffs[b.type].name).join(', ') || 'Без усилений';
    
    elements.resultDetails.textContent = `Вы: ${choiceNames[finalPlayerChoice]} + ${playerBuffsText} | Враг: ${choiceNames[finalEnemyChoice]} + ${enemyBuffsText}`;
    
    gameState.phase = 'result';
    updateDisplay();
    updateHealthBars();
  
    // Проверяем конец игры
    if (gameState.playerHealth <= 0 || gameState.enemyHealth <= 0) {
        showGameOver();
    }
  }
  
  // Показать конец игры
  function showGameOver() {
    elements.gameOverTitle.textContent = gameState.playerHealth <= 0 ? 'ПОРАЖЕНИЕ' : 'ПОБЕДА!';
    elements.gameOver.classList.remove('hidden');
    elements.gameInterface.classList.add('hidden');
    elements.nextRoundBtn.classList.add('hidden');
  }
  
  // Следующий раунд
  function nextRound() {
    gameState.round++;
    gameState.phase = 'selecting';
    gameState.playerChoice = null;
    gameState.enemyChoice = null;
    gameState.blockedChoices = [];
    
    // Уменьшаем длительность баффов
    decreaseBuffDuration();
    
    updateRoundNumber();
    updateDisplay();
    updateActiveBuffsDisplay();
    clearSelections();
    updateBlockedChoices();
  }
  
  // Новая игра
  function newGame() {
    gameState = {
        phase: 'selecting',
        playerHealth: 10,
        enemyHealth: 10,
        playerChoice: null,
        playerActiveBuffs: [],
        enemyChoice: null,
        enemyActiveBuffs: [],
        blockedChoices: [],
        round: 1
    };
    
    updateRoundNumber();
    updateHealthBars();
    updateDisplay();
    updateActiveBuffsDisplay();
    clearSelections();
    updateBlockedChoices();
    elements.gameOver.classList.add('hidden');
  }
  
  // Обновление отображения
  function updateDisplay() {
    // Обновляем выборы
    elements.playerChoice.textContent = gameState.phase === 'selecting' ? '?' : 
                                     gameState.phase === 'reveal' ? '...' : 
                                     choiceEmojis[gameState.playerChoice];
    
    elements.enemyChoice.textContent = gameState.phase === 'selecting' ? '?' : 
                                     gameState.phase === 'reveal' ? '...' : 
                                     choiceEmojis[gameState.enemyChoice];
  
    // Показываем/скрываем элементы
    if (gameState.phase === 'result') {
        elements.resultSection.classList.remove('hidden');
        elements.gameInterface.classList.add('hidden');
        if (gameState.playerHealth > 0 && gameState.enemyHealth > 0) {
            elements.nextRoundBtn.classList.remove('hidden');
        }
    } else {
        elements.resultSection.classList.add('hidden');
        elements.gameInterface.classList.remove('hidden');
        elements.nextRoundBtn.classList.add('hidden');
    }
    
    // Обновляем отображение активных баффов
    updateActiveBuffsDisplay();
  }
  
  // Обновление заблокированных выборов
  function updateBlockedChoices() {
    // Сбрасываем все блокировки
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('blocked');
    });
  
    // Применяем текущие блокировки
    gameState.blockedChoices.forEach(choice => {
        const btn = document.querySelector(`[data-choice="${choice}"]`);
        if (btn) {
            btn.disabled = true;
            btn.classList.add('blocked');
        }
    });
  
    // Показываем информацию о блокировках
    if (gameState.blockedChoices.length > 0) {
        elements.blockedChoices.textContent = `Заблокировано: ${gameState.blockedChoices.map(c => choiceNames[c]).join(', ')}`;
        elements.blockedChoices.classList.remove('hidden');
    } else {
        elements.blockedChoices.classList.add('hidden');
    }
  }
  
  // Очистка выделений
  function clearSelections() {
    document.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.buff-btn').forEach(btn => btn.classList.remove('selected'));
    updateMakeMoveButton();
  }
  
  // Запуск игры
  init();