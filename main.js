// Константы игры
const GAME_CONFIG = {
    MAX_HEALTH: 10,
    CHOICES: ['rock', 'paper', 'scissors'],
    CHOICE_EMOJIS: { rock: '✊', paper: '✋', scissors: '✌️' },
    CHOICE_NAMES: { rock: 'Камень', paper: 'Бумага', scissors: 'Ножницы' },
    PHASES: {
      SELECTING: 'selecting',
      REVEAL: 'reveal',
      RESULT: 'result'
    },
    // Новые константы для прогрессии
    PROGRESSION: {
      PLAYER_BASE_HEALTH: 3,
      ENEMY_BASE_HEALTH: 1,
      PLAYER_HEALTH_INCREMENT: 0.5,
      ENEMY_HEALTH_INCREMENT: 1
    },
    // Имена монстров с эмодзи
    MONSTER_NAMES: [
      { name: 'Гоблин', emoji: '👹' },
      { name: 'Орк', emoji: '🧌' },
      { name: 'Скелет', emoji: '💀' },
      { name: 'Дракон', emoji: '🐉' },
      { name: 'Демон', emoji: '😈' },
      { name: 'Тролль', emoji: '🧟' },
      { name: 'Вампир', emoji: '🧛' },
      { name: 'Зомби', emoji: '🧟‍♂️' },
      { name: 'Василиск', emoji: '🐍' },
      { name: 'Минотавр', emoji: '🐂' },
      { name: 'Ведьма', emoji: '🧙‍♀️' },
      { name: 'Призрак', emoji: '👻' },
      { name: 'Кентавр', emoji: '🏹' },
      { name: 'Грифон', emoji: '🦅' },
      { name: 'Химера', emoji: '🦁' },
      { name: 'Левиафан', emoji: '🐋' },
      { name: 'Феникс', emoji: '🔥' },
      { name: 'Сфинкс', emoji: '🗿' },
      { name: 'Кракен', emoji: '🐙' },
      { name: 'Темный Лорд', emoji: '👑' }
    ]
  };
  
  // Определения баффов
  const BUFF_DEFINITIONS = {
    block: {
      name: 'Блок',
      description: 'Блокирует один случайный выбор противника в следующем раунде.',
      duration: 1,
      blocksEnemyChoice: true
    },
    tie_damage: {
      name: 'Ничья+',
      description: 'При ничейном результате вы наносите 1 урон противнику.',
      duration: 2,
      tieDamageToEnemy: 1
    },
    chaos: {
      name: 'Хаос',
      description: 'Рандомизирует выборы обеих сторон.',
      duration: 1,
      randomizesChoices: true
    },
    double: {
      name: 'x2',
      description: 'При победе наносите двойной урон (2 вместо 1).',
      duration: 3,
      winDamageMultiplier: 2
    },
    counter: {
      name: 'Контр',
      description: 'При поражении наносите 1 урон противнику.',
      duration: 2,
      loseDamageToEnemy: 1
    },
    shield: {
      name: 'Щит',
      description: 'Уменьшает получаемый урон на 1 (минимум 0).',
      duration: 3,
      damageReduction: 1
    },
    rage: {
      name: 'Ярость',
      description: 'Увеличивает наносимый урон на 1.',
      duration: 2,
      damageBonus: 1
    }
  };
  
  // Класс для управления состоянием игры
  class GameState {
    constructor() {
      this.reset();
    }
  
    reset() {
      this.phase = GAME_CONFIG.PHASES.SELECTING;
      this.round = 1;
      this.updateHealthForRound();
      this.playerChoice = null;
      this.playerBuff = null;
      this.playerActiveBuffs = [];
      this.enemyChoice = null;
      this.blockedChoices = [];
      this.currentMonster = this.getMonsterForRound(1);
    }

    // Метод для получения монстра для текущего раунда
    getMonsterForRound(round) {
      const monsterIndex = (round - 1) % GAME_CONFIG.MONSTER_NAMES.length;
      return GAME_CONFIG.MONSTER_NAMES[monsterIndex];
    }

    // Метод для расчета здоровья на основе раунда
    updateHealthForRound() {
      this.playerMaxHealth = Math.round(
        GAME_CONFIG.PROGRESSION.PLAYER_BASE_HEALTH + 
        (this.round - 1) * GAME_CONFIG.PROGRESSION.PLAYER_HEALTH_INCREMENT
      );
      this.enemyMaxHealth = 
        GAME_CONFIG.PROGRESSION.ENEMY_BASE_HEALTH + 
        (this.round - 1) * GAME_CONFIG.PROGRESSION.ENEMY_HEALTH_INCREMENT;
      
      // Здоровье игрока восстанавливается только при смерти или новой игре
      if (this.playerHealth === undefined) {
        this.playerHealth = this.playerMaxHealth;
      }
      
      // Враг всегда появляется с полным здоровьем
      this.enemyHealth = this.enemyMaxHealth;
      
      // Обновляем текущего монстра
      this.currentMonster = this.getMonsterForRound(this.round);
    }

    // Метод для продолжения текущего раунда (после хода)
    continueCurrentRound() {
      this.phase = GAME_CONFIG.PHASES.SELECTING;
      this.playerChoice = null;
      this.playerBuff = null;
      this.enemyChoice = null;
      this.blockedChoices = [];
    }

    // Метод для перехода к следующему раунду (новый враг)
    advanceToNextRound() {
      this.round++;
      this.updateHealthForRound();
      this.phase = GAME_CONFIG.PHASES.SELECTING;
      this.playerChoice = null;
      this.playerBuff = null;
      this.enemyChoice = null;
      this.blockedChoices = [];
    }

    // Метод для восстановления здоровья игрока (при поражении или новой игре)
    resetPlayerHealth() {
      this.playerHealth = this.playerMaxHealth;
    }
  
    isRoundOver() {
      return this.enemyHealth <= 0;
    }

    isGameOver() {
      return this.playerHealth <= 0;
    }
  
    getWinner() {
      if (this.playerHealth <= 0) return 'enemy';
      if (this.enemyHealth <= 0) return 'player';
      return null;
    }
  }
  
  // Класс для управления баффами
  class BuffManager {
    static addBuff(gameState, buffType) {
      const buffDef = BUFF_DEFINITIONS[buffType];
      if (!buffDef) return;
      
      const existingBuffIndex = gameState.playerActiveBuffs.findIndex(b => b.type === buffType);
      if (existingBuffIndex >= 0) {
        gameState.playerActiveBuffs[existingBuffIndex].duration = buffDef.duration;
      } else {
        gameState.playerActiveBuffs.push({
          type: buffType,
          name: buffDef.name,
          duration: buffDef.duration,
          ...buffDef
        });
      }
    }
  
    static decreaseDuration(gameState) {
      gameState.playerActiveBuffs = gameState.playerActiveBuffs.filter(buff => {
        buff.duration--;
        return buff.duration > 0;
      });
    }
  
    static getModifier(gameState, property) {
      return gameState.playerActiveBuffs.reduce((sum, buff) => {
        return sum + (buff[property] || 0);
      }, 0);
    }
  
    static hasProperty(gameState, property) {
      return gameState.playerActiveBuffs.some(buff => buff[property]);
    }
  }
  
  // Класс для управления DOM элементами
  class DOMManager {
    constructor() {
      this.elements = {
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
        buffInfoDescription: document.getElementById('buff-info-description'),
        playerActiveBuffs: document.getElementById('player-active-buffs'),
        roundCounter: document.querySelector('.round-counter')
      };
    }
  
    updateHealthBar(elementId, health, maxHealth) {
      const element = this.elements[elementId];
      element.innerHTML = '';
      
      for (let i = 0; i < maxHealth; i++) {
        const healthPoint = document.createElement('div');
        healthPoint.className = `health-point ${i < health ? 'health-full' : 'health-empty'}`;
        element.appendChild(healthPoint);
      }

      // Обновляем aria-атрибуты для доступности
      element.setAttribute('aria-valuemax', maxHealth);
      element.setAttribute('aria-valuenow', health);
    }
  
    updateRoundNumber(round, monster) {
      this.elements.roundNumber.textContent = round;
      // Обновляем информацию о монстре в счетчике раундов
      this.elements.roundCounter.innerHTML = `
        РАУНД <span id="round-number">${round}</span>
        <div class="monster-info">
          <span class="monster-emoji">${monster.emoji}</span>
          <span class="monster-name">${monster.name}</span>
        </div>
      `;
    }
  
    updateChoiceDisplay(playerId, choice, phase) {
      const element = this.elements[playerId];
      
      if (phase === GAME_CONFIG.PHASES.SELECTING) {
        element.textContent = '?';
      } else if (phase === GAME_CONFIG.PHASES.REVEAL) {
        element.textContent = '...';
      } else {
        element.textContent = GAME_CONFIG.CHOICE_EMOJIS[choice];
      }
    }
  
    showBuffInfo(buffType) {
      const buff = BUFF_DEFINITIONS[buffType];
      this.elements.buffInfoTitle.textContent = `${buff.name} (${buff.duration} ходов)`;
      this.elements.buffInfoDescription.textContent = buff.description;
    }
  
    clearBuffInfo() {
      this.elements.buffInfoTitle.textContent = '';
      this.elements.buffInfoDescription.textContent = '';
    }
  
    updateActiveBuffs(activeBuffs) {
      this.elements.playerActiveBuffs.innerHTML = '';
      
      activeBuffs.forEach(buff => {
        const buffElement = document.createElement('div');
        buffElement.className = 'active-buff';
        buffElement.innerHTML = `
          <span class="buff-name">${buff.name}</span>
          <span class="buff-duration">${buff.duration}</span>
        `;
        this.elements.playerActiveBuffs.appendChild(buffElement);
      });
    }
  
    updateBlockedChoices(blockedChoices) {
      // Сбрасываем блокировки
      document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('blocked');
      });
  
      // Применяем новые блокировки
      blockedChoices.forEach(choice => {
        const btn = document.querySelector(`[data-choice="${choice}"]`);
        if (btn) {
          btn.disabled = true;
          btn.classList.add('blocked');
        }
      });
  
      // Показываем информацию о блокировках
      if (blockedChoices.length > 0) {
        this.elements.blockedChoices.textContent = 
          `Заблокировано: ${blockedChoices.map(c => GAME_CONFIG.CHOICE_NAMES[c]).join(', ')}`;
        this.elements.blockedChoices.classList.remove('hidden');
      } else {
        this.elements.blockedChoices.classList.add('hidden');
      }
    }
  
    clearSelections() {
      document.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('selected'));
      document.querySelectorAll('.buff-btn').forEach(btn => btn.classList.remove('selected'));
    }
  
    toggleVisibility(elementId, show) {
      this.elements[elementId].classList.toggle('hidden', !show);
    }
  
    updateMakeMoveButton(canMove) {
      this.elements.makeMoveBtn.disabled = !canMove;
    }

    // Обновленный метод для отображения информации о прогрессии
    showRoundProgression(gameState) {
      const progressionInfo = `${gameState.currentMonster.emoji} ${gameState.currentMonster.name} - Ваше ❤️: ${gameState.playerHealth}/${gameState.playerMaxHealth}, Враг ❤️: ${gameState.enemyMaxHealth}`;
      
      // Создаем временное уведомление
      const notification = document.createElement('div');
      notification.className = 'progression-notification';
      notification.textContent = progressionInfo;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 2500);
    }

    showEnemyDefeated(monster) {
      // Показываем сообщение о победе над врагом
      const victoryMessage = document.createElement('div');
      victoryMessage.className = 'enemy-defeated-notification';
      victoryMessage.innerHTML = `
        <div class="victory-emoji">🏆</div>
        <div class="victory-title">${monster.emoji} ${monster.name} ПОБЕЖДЕН!</div>
        <div class="victory-subtitle">Готовьтесь к следующему противнику...</div>
      `;
      
      document.body.appendChild(victoryMessage);
      
      setTimeout(() => {
        if (victoryMessage.parentNode) {
          victoryMessage.parentNode.removeChild(victoryMessage);
        }
      }, 3000);
    }
  }
  
  // Класс для логики боя
  class CombatResolver {
    static getWinner(choice1, choice2) {
      if (choice1 === choice2) return 'tie';
      
      const winConditions = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper'
      };
      
      return winConditions[choice1] === choice2 ? 'player' : 'enemy';
    }
  
    static resolveRound(gameState) {
      let finalPlayerChoice = gameState.playerChoice;
      let finalEnemyChoice = gameState.enemyChoice;
      let playerDamage = 0;
      let enemyDamage = 0;
      let resultMessages = [];
  
      // Применяем эффекты баффов
      const effects = this.applyBuffEffects(gameState, finalPlayerChoice, finalEnemyChoice);
      finalPlayerChoice = effects.playerChoice;
      finalEnemyChoice = effects.enemyChoice;
      resultMessages.push(...effects.messages);
  
      const winner = this.getWinner(finalPlayerChoice, finalEnemyChoice);
      
      // Рассчитываем урон
      const damage = this.calculateDamage(gameState, winner);
      playerDamage = damage.player;
      enemyDamage = damage.enemy;
      resultMessages.push(...damage.messages);
  
      // Применяем урон
      gameState.playerHealth = Math.max(0, gameState.playerHealth - playerDamage);
      gameState.enemyHealth = Math.max(0, gameState.enemyHealth - enemyDamage);
  
      return {
        winner,
        finalPlayerChoice,
        finalEnemyChoice,
        messages: resultMessages,
        playerDamage,
        enemyDamage
      };
    }
  
    static applyBuffEffects(gameState, playerChoice, enemyChoice) {
      let finalPlayerChoice = playerChoice;
      let finalEnemyChoice = enemyChoice;
      let messages = [];
  
      // Блокировка выбора врага
      if (BuffManager.hasProperty(gameState, 'blocksEnemyChoice')) {
        const blockedChoice = GAME_CONFIG.CHOICES[Math.floor(Math.random() * GAME_CONFIG.CHOICES.length)];
        if (finalEnemyChoice === blockedChoice) {
          const availableChoices = GAME_CONFIG.CHOICES.filter(choice => choice !== blockedChoice);
          finalEnemyChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
          messages.push(`Блок заблокировал ${GAME_CONFIG.CHOICE_NAMES[blockedChoice]}!`);
        }
      }
      
      // Рандомизация выборов
      if (BuffManager.hasProperty(gameState, 'randomizesChoices')) {
        finalPlayerChoice = GAME_CONFIG.CHOICES[Math.floor(Math.random() * GAME_CONFIG.CHOICES.length)];
        finalEnemyChoice = GAME_CONFIG.CHOICES[Math.floor(Math.random() * GAME_CONFIG.CHOICES.length)];
        messages.push('Хаос изменил выборы!');
      }
  
      return { playerChoice: finalPlayerChoice, enemyChoice: finalEnemyChoice, messages };
    }
  
    static calculateDamage(gameState, winner) {
      let playerDamage = 0;
      let enemyDamage = 0;
      let messages = [];
  
      if (winner === 'tie') {
        messages.push('Ничья!');
        enemyDamage += BuffManager.getModifier(gameState, 'tieDamageToEnemy');
        if (BuffManager.getModifier(gameState, 'tieDamageToEnemy') > 0) {
          messages.push('Ничья+ наносит урон!');
        }
      } else if (winner === 'player') {
        messages.push('Вы победили!');
        
        let winDamage = 1;
        const winMultiplier = BuffManager.getModifier(gameState, 'winDamageMultiplier');
        if (winMultiplier > 0) {
          winDamage = winMultiplier;
          messages.push('Двойной урон!');
        }
        
        winDamage += BuffManager.getModifier(gameState, 'damageBonus');
        if (BuffManager.getModifier(gameState, 'damageBonus') > 0) {
          messages.push('Ярость увеличивает урон!');
        }
        
        enemyDamage += winDamage;
      } else {
        messages.push('Враг победил!');
        playerDamage += 1;
        
        enemyDamage += BuffManager.getModifier(gameState, 'loseDamageToEnemy');
        if (BuffManager.getModifier(gameState, 'loseDamageToEnemy') > 0) {
          messages.push('Контратака!');
        }
      }
  
      // Применяем защиту
      if (playerDamage > 0) {
        const reduction = BuffManager.getModifier(gameState, 'damageReduction');
        if (reduction > 0) {
          playerDamage = Math.max(0, playerDamage - reduction);
          messages.push('Щит защитил!');
        }
      }
  
      return {
        player: Math.max(0, playerDamage),
        enemy: Math.max(0, enemyDamage),
        messages
      };
    }
  }
  
  // Главный класс игры
  class TacticalRockPaperScissors {
    constructor() {
      this.gameState = new GameState();
      this.domManager = new DOMManager();
      this.init();
    }
  
    init() {
      this.setupEventListeners();
      this.updateDisplay();
      // Показываем начальную прогрессию
      setTimeout(() => {
        this.domManager.showRoundProgression(this.gameState);
      }, 500);
    }
  
    setupEventListeners() {
      // Выбор действий
      document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => this.handleChoiceSelection(e));
      });
  
      // Выбор баффов
      document.querySelectorAll('.buff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => this.handleBuffSelection(e));
      });
  
      // Кнопки управления
      this.domManager.elements.makeMoveBtn.addEventListener('click', () => this.makeMove());
      this.domManager.elements.nextRoundBtn.addEventListener('click', () => this.nextRound());
      document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
    }
  
    handleChoiceSelection(e) {
      const choice = e.target.dataset.choice;
      if (this.gameState.blockedChoices.includes(choice)) return;
      
      document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
      
      if (this.gameState.playerChoice === choice) {
        this.gameState.playerChoice = null;
      } else {
        this.gameState.playerChoice = choice;
        e.target.classList.add('selected');
      }
      
      this.updateMakeMoveButton();
    }
  
    handleBuffSelection(e) {
      const buffType = e.target.dataset.buff;
      
      document.querySelectorAll('.buff-btn').forEach(b => b.classList.remove('selected'));
      
      if (this.gameState.playerBuff === buffType) {
        this.gameState.playerBuff = null;
        this.domManager.clearBuffInfo();
      } else {
        this.gameState.playerBuff = buffType;
        e.target.classList.add('selected');
        this.domManager.showBuffInfo(buffType);
      }
      
      this.updateMakeMoveButton();
    }
  
    updateMakeMoveButton() {
      const canMove = this.gameState.playerChoice;
      this.domManager.updateMakeMoveButton(canMove);
    }
  
    makeMove() {
      // Применяем выбранный бафф
      if (this.gameState.playerBuff) {
        BuffManager.addBuff(this.gameState, this.gameState.playerBuff);
        this.gameState.playerBuff = null;
      }
      
      this.gameState.phase = GAME_CONFIG.PHASES.REVEAL;
      this.generateEnemyMove();
      this.updateDisplay();
      
      setTimeout(() => this.resolveRound(), 500);
    }
  
    generateEnemyMove() {
      const randomIndex = Math.floor(Math.random() * GAME_CONFIG.CHOICES.length);
      this.gameState.enemyChoice = GAME_CONFIG.CHOICES[randomIndex];
    }
  
    resolveRound() {
      const result = CombatResolver.resolveRound(this.gameState);
      
      this.domManager.elements.resultText.textContent = result.messages.join(' ');
      
      const playerBuffsText = this.gameState.playerActiveBuffs.map(b => b.name).join(', ') || 'Без усилений';
      this.domManager.elements.resultDetails.textContent = 
        `Вы: ${GAME_CONFIG.CHOICE_NAMES[result.finalPlayerChoice]} + ${playerBuffsText} | Враг: ${GAME_CONFIG.CHOICE_NAMES[result.finalEnemyChoice]}`;
      
      this.gameState.phase = GAME_CONFIG.PHASES.RESULT;
      this.updateDisplay();
      
      // Проверяем результат боя
      if (this.gameState.isGameOver()) {
        // Игрок умер - конец игры
        this.showGameOver();
      } else if (this.gameState.isRoundOver()) {
        // Враг побежден - переход к следующему раунду
        this.showEnemyDefeated();
      }
    }

    showEnemyDefeated() {
      this.domManager.showEnemyDefeated(this.gameState.currentMonster);
    }
  
    showGameOver() {
      const winner = this.gameState.getWinner();
      let title = 'ПОРАЖЕНИЕ';
      let subtitle = `Вас победил ${this.gameState.currentMonster.emoji} ${this.gameState.currentMonster.name} на раунде ${this.gameState.round}`;
      
      if (winner === 'player') {
        title = 'НЕВЕРОЯТНО!';
        subtitle = `Все враги побеждены!`;
      }
      
      this.domManager.elements.gameOverTitle.innerHTML = `
        <div class="game-over-main-title">${title}</div>
        <div class="game-over-subtitle">${subtitle}</div>
      `;
      
      this.domManager.toggleVisibility('gameOver', true);
      this.domManager.toggleVisibility('gameInterface', false);
      this.domManager.toggleVisibility('nextRoundBtn', false);
    }
  
    nextRound() {
      if (this.gameState.isRoundOver()) {
        // Враг побежден - переходим к следующему противнику
        BuffManager.decreaseDuration(this.gameState);
        this.gameState.advanceToNextRound();
        
        this.domManager.clearSelections();
        this.domManager.clearBuffInfo();
        this.updateDisplay();
        
        // Показываем информацию о новом противнике
        setTimeout(() => {
          this.domManager.showRoundProgression(this.gameState);
        }, 300);
      } else {
        // Обычное продолжение боя с тем же врагом
        BuffManager.decreaseDuration(this.gameState);
        this.gameState.continueCurrentRound();
        
        this.domManager.clearSelections();
        this.domManager.clearBuffInfo();
        this.updateDisplay();
      }
    }
  
    newGame() {
      this.gameState.reset();
      this.domManager.clearSelections();
      this.domManager.clearBuffInfo();
      this.domManager.toggleVisibility('gameOver', false);
      this.updateDisplay();
      
      // Показываем начальную прогрессию
      setTimeout(() => {
        this.domManager.showRoundProgression(this.gameState);
      }, 500);
    }
  
    updateDisplay() {
      // Обновляем все элементы интерфейса
      this.domManager.updateRoundNumber(this.gameState.round, this.gameState.currentMonster);
      this.domManager.updateHealthBar('playerHealth', this.gameState.playerHealth, this.gameState.playerMaxHealth);
      this.domManager.updateHealthBar('enemyHealth', this.gameState.enemyHealth, this.gameState.enemyMaxHealth);
      this.domManager.updateChoiceDisplay('playerChoice', this.gameState.playerChoice, this.gameState.phase);
      this.domManager.updateChoiceDisplay('enemyChoice', this.gameState.enemyChoice, this.gameState.phase);
      this.domManager.updateActiveBuffs(this.gameState.playerActiveBuffs);
      this.domManager.updateBlockedChoices(this.gameState.blockedChoices);
      
      // Управляем видимостью секций
      const isResult = this.gameState.phase === GAME_CONFIG.PHASES.RESULT;
      const canContinue = !this.gameState.isGameOver();
      
      this.domManager.toggleVisibility('resultSection', isResult);
      this.domManager.toggleVisibility('gameInterface', !isResult);
      this.domManager.toggleVisibility('nextRoundBtn', isResult && canContinue);
    }
  }
  
  // Запуск игры
  document.addEventListener('DOMContentLoaded', () => {
    new TacticalRockPaperScissors();
  });