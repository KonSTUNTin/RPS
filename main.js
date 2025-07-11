// Класс для баффов
class Buff {
    constructor(type, name, description, duration, config = {}) {
      this.type = type;
      this.name = name;
      this.description = description;
      this.duration = duration;
      this.maxDuration = duration;
      
      // Конфигурация баффа
      this.affectsBothPlayers = config.affectsBothPlayers || false;
      this.isRandomEffect = config.isRandomEffect || false;
      this.triggersOn = config.triggersOn || []; // ['win', 'lose', 'tie', 'damage_taken', 'damage_dealt']
      this.modifies = config.modifies || {}; // { damage: 1, defense: 1, etc. }
      this.blocksChoices = config.blocksChoices || false;
      this.randomizesChoices = config.randomizesChoices || false;
    }
    
    // Проверяет, срабатывает ли бафф при данном условии
    triggersOnCondition(condition) {
      return this.triggersOn.includes(condition);
    }
    
    // Применяет эффект баффа
    applyEffect(gameState, player, condition, context = {}) {
      let result = {
        message: '',
        playerDamageModifier: 0,
        enemyDamageModifier: 0,
        newPlayerChoice: null,
        newEnemyChoice: null,
        blockedChoice: null
      };
      
      switch (this.type) {
        case 'block':
          if (condition === 'start_turn') {
            const choices = ['rock', 'paper', 'scissors'];
            const blockedChoice = choices[Math.floor(Math.random() * choices.length)];
            result.blockedChoice = blockedChoice;
            result.message = `Блок заблокировал ${gameState.choiceNames[blockedChoice]}!`;
          }
          break;
          
        case 'tie_damage':
          if (condition === 'tie') {
            if (player === 'player') {
              result.enemyDamageModifier = 1;
            } else {
              result.playerDamageModifier = 1;
            }
            result.message = 'Ничья+ наносит урон!';
          }
          break;
          
        case 'chaos':
          if (condition === 'start_turn') {
            const choices = ['rock', 'paper', 'scissors'];
            result.newPlayerChoice = choices[Math.floor(Math.random() * choices.length)];
            result.newEnemyChoice = choices[Math.floor(Math.random() * choices.length)];
            result.message = 'Хаос изменил выборы!';
          }
          break;
          
        case 'double':
          if (condition === 'win') {
            if (player === 'player') {
              result.enemyDamageModifier = 1;
            } else {
              result.playerDamageModifier = 1;
            }
            result.message = 'Двойной урон!';
          }
          break;
          
        case 'counter':
          if (condition === 'lose') {
            if (player === 'player') {
              result.enemyDamageModifier = 1;
            } else {
              result.playerDamageModifier = 1;
            }
            result.message = 'Контратака!';
          }
          break;
          
        case 'shield':
          if (condition === 'damage_taken') {
            if (player === 'player') {
              result.playerDamageModifier = -1;
            } else {
              result.enemyDamageModifier = -1;
            }
            result.message = 'Щит защитил!';
          }
          break;
          
        case 'rage':
          if (condition === 'damage_dealt') {
            if (player === 'player') {
              result.enemyDamageModifier = 1;
            } else {
              result.playerDamageModifier = 1;
            }
            result.message = 'Ярость увеличивает урон!';
          }
          break;
      }
      
      return result;
    }
  }
  
  // Состояние игры
  let gameState = {
    phase: 'selecting', // 'selecting', 'reveal', 'result'
    playerHealth: 10,
    enemyHealth: 10,
    playerChoice: null,
    playerBuff: null,
    playerActiveBuffs: [], // Массив объектов Buff
    enemyChoice: null,
    enemyActiveBuffs: [], // Массив объектов Buff
    blockedChoices: [],
    round: 1,
    choiceNames: { rock: 'Камень', paper: 'Бумага', scissors: 'Ножницы' }
  };
  
  // Данные игры
  const choices = ['rock', 'paper', 'scissors'];
  const choiceEmojis = { rock: '✊', paper: '✋', scissors: '✌️' };
  
  // Определение всех баффов через массив
  const buffDefinitions = [
    {
      type: 'block',
      name: 'Блок',
      description: 'Блокирует один случайный выбор противника в следующем раунде. Враг не сможет использовать заблокированное действие.',
      duration: 1,
      config: {
        triggersOn: ['start_turn'],
        blocksChoices: true
      }
    },
    {
      type: 'tie_damage',
      name: 'Ничья+',
      description: 'При ничейном результате вы наносите 1 урон противнику. Превращает ничью в ваше преимущество.',
      duration: 2,
      config: {
        triggersOn: ['tie']
      }
    },
    {
      type: 'chaos',
      name: 'Хаос',
      description: 'Рандомизирует выборы обеих сторон. Никто не знает, что получится - полная случайность!',
      duration: 1,
      config: {
        affectsBothPlayers: true,
        isRandomEffect: true,
        triggersOn: ['start_turn'],
        randomizesChoices: true
      }
    },
    {
      type: 'double',
      name: 'x2',
      description: 'При победе наносите двойной урон (2 вместо 1). Мощная атака для решающего удара.',
      duration: 3,
      config: {
        triggersOn: ['win'],
        modifies: { damage: 1 }
      }
    },
    {
      type: 'counter',
      name: 'Контр',
      description: 'При поражении наносите 1 урон противнику. Даже проигрывая, вы не остаетесь без ответа.',
      duration: 2,
      config: {
        triggersOn: ['lose']
      }
    },
    {
      type: 'shield',
      name: 'Щит',
      description: 'Уменьшает получаемый урон на 1 (минимум 0). Надежная защита от атак противника.',
      duration: 3,
      config: {
        triggersOn: ['damage_taken'],
        modifies: { defense: 1 }
      }
    },
    {
      type: 'rage',
      name: 'Ярость',
      description: 'Увеличивает наносимый урон на 1. Ваши атаки становятся более разрушительными.',
      duration: 2,
      config: {
        triggersOn: ['damage_dealt'],
        modifies: { damage: 1 }
      }
    }
  ];
  
  // Создаем объект баффов для быстрого доступа
  const buffs = {};
  buffDefinitions.forEach(def => {
    buffs[def.type] = def;
  });
  
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
    buffInfoSection: document.getElementById('buff-info-section'),
    buffInfoTitle: document.getElementById('buff-info-title'),
    buffInfoDescription: document.getElementById('buff-info-description')
  };
  
  // Функция для создания баффа
  function createBuff(buffType) {
    const def = buffs[buffType];
    return new Buff(def.type, def.name, def.description, def.duration, def.config);
  }
  
  // Функция для добавления баффа
  function addBuff(target, buffType) {
    const newBuff = createBuff(buffType);
    
    if (target === 'player') {
      // Проверяем, есть ли уже такой бафф
      const existingBuffIndex = gameState.playerActiveBuffs.findIndex(b => b.type === buffType);
      if (existingBuffIndex >= 0) {
        gameState.playerActiveBuffs[existingBuffIndex].duration = newBuff.duration; // Обновляем длительность
      } else {
        gameState.playerActiveBuffs.push(newBuff);
      }
    } else {
      const existingBuffIndex = gameState.enemyActiveBuffs.findIndex(b => b.type === buffType);
      if (existingBuffIndex >= 0) {
        gameState.enemyActiveBuffs[existingBuffIndex].duration = newBuff.duration;
      } else {
        gameState.enemyActiveBuffs.push(newBuff);
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
  
  // Функция для получения баффов, срабатывающих при определенном условии
  function getBuffsTriggeredBy(target, condition) {
    const buffs = target === 'player' ? gameState.playerActiveBuffs : gameState.enemyActiveBuffs;
    return buffs.filter(buff => buff.triggersOnCondition(condition));
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
        <span class="buff-name">${buff.name}</span>
        <span class="buff-duration">${buff.duration}</span>
      `;
      playerBuffsContainer.appendChild(buffElement);
    });
    
    // Отображаем баффы врага
    gameState.enemyActiveBuffs.forEach(buff => {
      const buffElement = document.createElement('div');
      buffElement.className = 'active-buff';
      buffElement.innerHTML = `
        <span class="buff-name">${buff.name}</span>
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
    clearBuffInfo();
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
  
  // Показать информацию о баффе
  function showBuffInfo(buffType) {
    const buff = buffs[buffType];
    elements.buffInfoTitle.textContent = `${buff.name} (${buff.duration} ходов)`;
    elements.buffInfoDescription.textContent = buff.description;
  }
  
  // Очистить информацию о баффе
  function clearBuffInfo() {
    elements.buffInfoTitle.textContent = '';
    elements.buffInfoDescription.textContent = '';
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
  
    // Выбор баффов
    document.querySelectorAll('.buff-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const buffType = e.target.dataset.buff;
        
        // Убираем выделение с других кнопок баффов
        document.querySelectorAll('.buff-btn').forEach(b => b.classList.remove('selected'));
        
        if (gameState.playerBuff === buffType) {
          // Если уже выбран этот бафф, отменяем выбор
          gameState.playerBuff = null;
          clearBuffInfo();
        } else {
          // Выбираем новый бафф
          gameState.playerBuff = buffType;
          e.target.classList.add('selected');
          showBuffInfo(buffType);
        }
        
        updateMakeMoveButton();
      });
    });
  
    // Кнопка хода
    elements.makeMoveBtn.addEventListener('click', makeMove);
  
    // Кнопка следующего раунда
    elements.nextRoundBtn.addEventListener('click', nextRound);
  
    // Кнопка новой игры
    document.getElementById('new-game-btn').addEventListener('click', newGame);
  }
  
  // Обновление кнопки хода
  function updateMakeMoveButton() {
    const canMove = gameState.playerChoice;
    elements.makeMoveBtn.disabled = !canMove;
  }
  
  // Сделать ход
  function makeMove() {
    // Применяем выбранный бафф если есть
    if (gameState.playerBuff) {
      addBuff('player', gameState.playerBuff);
      gameState.playerBuff = null;
    }
    
    gameState.phase = 'reveal';
    generateEnemyMove();
    updateDisplay();
    
    // Убираем задержку и сразу показываем результат
    setTimeout(() => {
      calculateResult();
    }, 500);
  }
  
  // Генерация хода врага
  function generateEnemyMove() {
    // Генерируем случайный выбор для врага
    gameState.enemyChoice = choices[Math.floor(Math.random() * choices.length)];
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
    let resultMessages = [];
  
    // Применяем баффы начала хода
    const playerStartBuffs = getBuffsTriggeredBy('player', 'start_turn');
    const enemyStartBuffs = getBuffsTriggeredBy('enemy', 'start_turn');
    
    [...playerStartBuffs, ...enemyStartBuffs].forEach(buff => {
      const player = gameState.playerActiveBuffs.includes(buff) ? 'player' : 'enemy';
      const effect = buff.applyEffect(gameState, player, 'start_turn');
      
      if (effect.message) resultMessages.push(effect.message);
      if (effect.newPlayerChoice) finalPlayerChoice = effect.newPlayerChoice;
      if (effect.newEnemyChoice) finalEnemyChoice = effect.newEnemyChoice;
      if (effect.blockedChoice && player === 'player') {
        // Блокируем выбор врага
        if (finalEnemyChoice === effect.blockedChoice) {
          const availableChoices = choices.filter(choice => choice !== effect.blockedChoice);
          finalEnemyChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
        }
      }
    });
  
    const winner = getWinner(finalPlayerChoice, finalEnemyChoice);
    
    // Базовый урон
    if (winner === 'tie') {
      resultMessages.push('Ничья!');
      
      // Применяем баффы при ничье
      const playerTieBuffs = getBuffsTriggeredBy('player', 'tie');
      const enemyTieBuffs = getBuffsTriggeredBy('enemy', 'tie');
      
      [...playerTieBuffs, ...enemyTieBuffs].forEach(buff => {
        const player = gameState.playerActiveBuffs.includes(buff) ? 'player' : 'enemy';
        const effect = buff.applyEffect(gameState, player, 'tie');
        
        if (effect.message) resultMessages.push(effect.message);
        playerDamage += effect.playerDamageModifier;
        enemyDamage += effect.enemyDamageModifier;
      });
      
    } else if (winner === 'player') {
      resultMessages.push('Вы победили!');
      enemyDamage += 1;
      
      // Применяем баффы при победе игрока
      const playerWinBuffs = getBuffsTriggeredBy('player', 'win');
      const enemyLoseBuffs = getBuffsTriggeredBy('enemy', 'lose');
      
      [...playerWinBuffs, ...enemyLoseBuffs].forEach(buff => {
        const player = gameState.playerActiveBuffs.includes(buff) ? 'player' : 'enemy';
        const condition = gameState.playerActiveBuffs.includes(buff) ? 'win' : 'lose';
        const effect = buff.applyEffect(gameState, player, condition);
        
        if (effect.message) resultMessages.push(effect.message);
        playerDamage += effect.playerDamageModifier;
        enemyDamage += effect.enemyDamageModifier;
      });
      
    } else {
      resultMessages.push('Враг победил!');
      playerDamage += 1;
      
      // Применяем баффы при поражении игрока
      const playerLoseBuffs = getBuffsTriggeredBy('player', 'lose');
      const enemyWinBuffs = getBuffsTriggeredBy('enemy', 'win');
      
      [...playerLoseBuffs, ...enemyWinBuffs].forEach(buff => {
        const player = gameState.playerActiveBuffs.includes(buff) ? 'player' : 'enemy';
        const condition = gameState.playerActiveBuffs.includes(buff) ? 'lose' : 'win';
        const effect = buff.applyEffect(gameState, player, condition);
        
        if (effect.message) resultMessages.push(effect.message);
        playerDamage += effect.playerDamageModifier;
        enemyDamage += effect.enemyDamageModifier;
      });
    }
  
    // Применяем баффы при получении урона
    if (playerDamage > 0) {
      const playerDefenseBuffs = getBuffsTriggeredBy('player', 'damage_taken');
      playerDefenseBuffs.forEach(buff => {
        const effect = buff.applyEffect(gameState, 'player', 'damage_taken');
        if (effect.message) resultMessages.push(effect.message);
        playerDamage += effect.playerDamageModifier;
      });
    }
    
    if (enemyDamage > 0) {
      const enemyDefenseBuffs = getBuffsTriggeredBy('enemy', 'damage_taken');
      enemyDefenseBuffs.forEach(buff => {
        const effect = buff.applyEffect(gameState, 'enemy', 'damage_taken');
        if (effect.message) resultMessages.push(effect.message);
        enemyDamage += effect.enemyDamageModifier;
      });
    }
  
    // Применяем баффы при нанесении урона
    if (enemyDamage > 0) {
      const playerOffenseBuffs = getBuffsTriggeredBy('player', 'damage_dealt');
      playerOffenseBuffs.forEach(buff => {
        const effect = buff.applyEffect(gameState, 'player', 'damage_dealt');
        if (effect.message) resultMessages.push(effect.message);
        enemyDamage += effect.enemyDamageModifier;
      });
    }
    
    if (playerDamage > 0) {
      const enemyOffenseBuffs = getBuffsTriggeredBy('enemy', 'damage_dealt');
      enemyOffenseBuffs.forEach(buff => {
        const effect = buff.applyEffect(gameState, 'enemy', 'damage_dealt');
        if (effect.message) resultMessages.push(effect.message);
        playerDamage += effect.playerDamageModifier;
      });
    }
  
    // Применяем урон (минимум 0)
    playerDamage = Math.max(0, playerDamage);
    enemyDamage = Math.max(0, enemyDamage);
    
    gameState.playerHealth = Math.max(0, gameState.playerHealth - playerDamage);
    gameState.enemyHealth = Math.max(0, gameState.enemyHealth - enemyDamage);
  
    // Обновляем интерфейс
    elements.resultText.textContent = resultMessages.join(' ');
    
    const playerBuffsText = gameState.playerActiveBuffs.map(b => b.name).join(', ') || 'Без усилений';
    const enemyBuffsText = gameState.enemyActiveBuffs.map(b => b.name).join(', ') || 'Без усилений';
    
    elements.resultDetails.textContent = `Вы: ${gameState.choiceNames[finalPlayerChoice]} + ${playerBuffsText} | Враг: ${gameState.choiceNames[finalEnemyChoice]} + ${enemyBuffsText}`;
    
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
    gameState.playerBuff = null;
    gameState.enemyChoice = null;
    gameState.blockedChoices = [];
    
    // Уменьшаем длительность баффов
    decreaseBuffDuration();
    
    updateRoundNumber();
    updateDisplay();
    updateActiveBuffsDisplay();
    clearSelections();
    clearBuffInfo();
    updateBlockedChoices();
  }
  
  // Новая игра
  function newGame() {
    gameState = {
      phase: 'selecting',
      playerHealth: 10,
      enemyHealth: 10,
      playerChoice: null,
      playerBuff: null,
      playerActiveBuffs: [],
      enemyChoice: null,
      enemyActiveBuffs: [],
      blockedChoices: [],
      round: 1,
      choiceNames: { rock: 'Камень', paper: 'Бумага', scissors: 'Ножницы' }
    };
    
    updateRoundNumber();
    updateHealthBars();
    updateDisplay();
    updateActiveBuffsDisplay();
    clearSelections();
    clearBuffInfo();
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
      elements.blockedChoices.textContent = `Заблокировано: ${gameState.blockedChoices.map(c => gameState.choiceNames[c]).join(', ')}`;
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