import * as THREE from 'three';

export class OpponentAI {
  constructor(character, matchManager) {
    this.character = character;
    this.match = matchManager;
    this.engine = matchManager.engine;
    
    this.difficulty = matchManager.difficulty || 1.0;
    this.reactionTime = 0.15 / this.difficulty;
    this.reactionTimer = 0;
    
    this.state = 'idle';
    this.targetPosition = new THREE.Vector3();
    this.targetVelocity = new THREE.Vector3();
    
    this.assignedMan = null;
    this.helpPosition = new THREE.Vector3();
    this.ballPressure = 0;
    
    this.stealCooldown = 0;
    this.blockCooldown = 0;
    this.crossoverCooldown = 0;
    this.jumpCooldown = 0;
    
    this.decisionTimer = 0;
    this.decisionInterval = 0.3;
    
    this.personality = this.generatePersonality();
    
    this.lastBallPos = new THREE.Vector3();
    this.predictedBallPos = new THREE.Vector3();
  }

  generatePersonality() {
    const attrs = this.character.attributes;
    const archetypes = ['lockdown', 'rim_protector', 'playmaker', 'scorer', 'balanced'];
    const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    
    return {
      archetype,
      aggression: 0.5 + Math.random() * 0.5,
      riskTaking: 0.3 + Math.random() * 0.4,
      helpDefense: 0.4 + Math.random() * 0.4,
      ballPressure: 0.3 + Math.random() * 0.5,
      jumpTendency: 0.3 + Math.random() * 0.5,
      stealTendency: 0.2 + Math.random() * 0.4,
    };
  }

  setAssignedMan(opponent) {
    this.assignedMan = opponent;
  }

  update(dt) {
    this.reactionTimer += dt;
    this.decisionTimer += dt;
    this.updateCooldowns(dt);
    
    if (this.character.state.stunned) return;
    
    this.predictBallTrajectory();
    this.makeDecisions();
    this.executeBehavior(dt);
  }

  updateCooldowns(dt) {
    this.stealCooldown = Math.max(0, this.stealCooldown - dt);
    this.blockCooldown = Math.max(0, this.blockCooldown - dt);
    this.crossoverCooldown = Math.max(0, this.crossoverCooldown - dt);
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
  }

  predictBallTrajectory() {
    const ball = this.match.ball;
    if (!ball) return;
    
    this.lastBallPos.copy(ball.position);
    
    if (ball.state === 'shot' && ball.shotInfo) {
      const info = ball.shotInfo;
      const timeToRim = info.t - info.age;
      if (timeToRim > 0) {
        this.predictedBallPos.copy(info.target);
      }
    } else if (ball.state === 'pass' || ball.state === 'alley_oop') {
      this.predictedBallPos.copy(ball.passInfo?.to || ball.position);
    } else {
      this.predictedBallPos.copy(ball.position);
    }
  }

  makeDecisions() {
    if (this.decisionTimer < this.decisionInterval) return;
    this.decisionTimer = 0;
    
    const ball = this.match.ball;
    const hasBall = ball.holder === this.character;
    const ballOnOffense = ball.holder && ball.holder.isHome === this.character.isHome;
    const ballOnDefense = ball.holder && ball.holder.isHome !== this.character.isHome;
    
    if (hasBall) {
      this.decideOffense();
    } else if (ballOnDefense) {
      this.decideOnBallDefense();
    } else if (ballOnOffense) {
      this.decideOffBallDefense();
    } else {
      this.decideLooseBall();
    }
  }

  decideOffense() {
    const attrs = this.character.attributes;
    const distToRim = this.getDistanceToRim();
    const defender = this.findNearestDefender();
    const defenderDist = defender ? this.character.position.distanceTo(defender.position) : 10;
    
    const canDunk = distToRim < 3 && attrs.vertical > 70 && defenderDist > 1.5;
    const canShoot = defenderDist > 2.5 || distToRim < 8;
    const shouldDrive = distToRim > 4 && attrs.speed > 7 && defenderDist > 2;
    const shouldPass = this.shouldPass();
    
    if (canDunk && Math.random() < 0.3 * this.difficulty) {
      this.state = 'dunk';
      this.targetRim = this.getTargetRim();
    } else if (canShoot && distToRim < 10 && Math.random() < 0.25 * this.difficulty) {
      this.state = 'shoot';
    } else if (shouldDrive) {
      this.state = 'drive';
      this.targetPosition.copy(this.getDriveTargetPosition());
    } else if (shouldPass) {
      this.state = 'pass';
      this.passTarget = this.findBestPassTarget();
    } else {
      this.state = 'dribble';
      this.targetPosition.copy(this.getSpacingPosition());
    }
  }

  decideOnBallDefense() {
    const ballHandler = this.match.ball.holder;
    const dist = this.character.position.distanceTo(ballHandler.position);
    const attrs = this.character.attributes;
    
    if (dist < 1.5 && this.stealCooldown <= 0 && Math.random() < this.personality.stealTendency * 0.05 * this.difficulty) {
      this.attemptSteal();
      return;
    }
    
    if (ballHandler.state.jumping && dist < 2.5 && this.blockCooldown <= 0 && Math.random() < this.personality.jumpTendency * 0.08 * this.difficulty) {
      this.attemptBlock();
      return;
    }
    
    this.state = 'on_ball_defense';
    this.ballPressure = Math.min(1, this.ballPressure + 0.1);
    
    const defendPos = this.getDefensivePosition(ballHandler);
    this.targetPosition.copy(defendPos);
    this.targetVelocity.set(0, 0, 0);
  }

  decideOffBallDefense() {
    if (!this.assignedMan) {
      this.assignedMan = this.findClosestOffensivePlayer();
    }
    
    if (this.assignedMan) {
      const manDist = this.character.position.distanceTo(this.assignedMan.position);
      const ballDist = this.character.position.distanceTo(this.match.ball.position);
      const rimDist = this.getDistanceToRim();
      
      if (this.personality.helpDefense > 0.6 && ballDist < 5 && manDist > 4) {
        this.state = 'help_defense';
        this.targetPosition.copy(this.getHelpPosition());
      } else {
        this.state = 'man_defense';
        this.targetPosition.copy(this.getManDefensePosition());
      }
    } else {
      this.state = 'zone_defense';
      this.targetPosition.copy(this.getZonePosition());
    }
  }

  decideLooseBall() {
    const ballDist = this.character.position.distanceTo(this.match.ball.position);
    const nearestOppDist = this.findNearestOpponentToBall()?.position.distanceTo(this.match.ball.position) || 100;
    
    if (ballDist < nearestOppDist * 1.2) {
      this.state = 'chase_ball';
      this.targetPosition.copy(this.match.ball.position);
    } else {
      this.state = 'retreat';
      this.targetPosition.copy(this.getRetreatPosition());
    }
  }

  executeBehavior(dt) {
    switch (this.state) {
      case 'dunk':
        this.executeDunk(dt);
        break;
      case 'shoot':
        this.executeShot(dt);
        break;
      case 'drive':
        this.executeDrive(dt);
        break;
      case 'pass':
        this.executePass(dt);
        break;
      case 'dribble':
        this.executeDribble(dt);
        break;
      case 'on_ball_defense':
        this.executeOnBallDefense(dt);
        break;
      case 'man_defense':
        this.executeManDefense(dt);
        break;
      case 'help_defense':
        this.executeHelpDefense(dt);
        break;
      case 'zone_defense':
        this.executeZoneDefense(dt);
        break;
      case 'chase_ball':
        this.executeChaseBall(dt);
        break;
      case 'retreat':
        this.executeRetreat(dt);
        break;
    }
  }

  executeDunk(dt) {
    const dunkSys = this.character.dunkSystem;
    if (dunkSys && !dunkSys.isDunking()) {
      const available = dunkSys.getAvailableDunks();
      if (available.length > 0) {
        const dunk = this.selectDunk(available);
        dunkSys.attemptDunk(dunk);
      }
    }
    this.moveTowardsRim(dt);
  }

  executeShot(dt) {
    if (!this.character.state.hasBall) {
      this.state = 'dribble';
      return;
    }
    
    const shotCharge = 0.5 + Math.random() * 0.4;
    if (this.character.shootBall) {
      this.character.shootBall(shotCharge);
    }
    this.state = 'dribble';
  }

  executeDrive(dt) {
    this.moveToTarget(dt, true);
    
    const distToRim = this.getDistanceToRim();
    if (distToRim < 3.5) {
      this.state = 'dunk';
    }
  }

  executePass(dt) {
    if (this.passTarget && this.match.ball.holder === this.character) {
      if (this.character.passBall) {
        this.character.passBall(this.passTarget);
      }
    }
    this.state = 'dribble';
  }

  executeDribble(dt) {
    this.moveToTarget(dt, false);
    
    if (this.crossoverCooldown <= 0 && Math.random() < 0.02 * this.difficulty) {
      this.performCrossover();
    }
  }

  executeOnBallDefense(dt) {
    const ballHandler = this.match.ball.holder;
    if (!ballHandler) return;
    
    const defendPos = this.getDefensivePosition(ballHandler);
    this.moveToPosition(defendPos, dt, false);
    
    this.faceTarget(ballHandler.position, dt);
  }

  executeManDefense(dt) {
    if (!this.assignedMan) return;
    
    const pos = this.getManDefensePosition();
    this.moveToPosition(pos, dt, false);
    this.faceTarget(this.assignedMan.position, dt);
  }

  executeHelpDefense(dt) {
    this.moveToPosition(this.helpPosition, dt, false);
  }

  executeZoneDefense(dt) {
    this.moveToPosition(this.getZonePosition(), dt, false);
  }

  executeChaseBall(dt) {
    this.moveToPosition(this.match.ball.position, dt, true);
  }

  executeRetreat(dt) {
    this.moveToPosition(this.getRetreatPosition(), dt, false);
  }

  moveToTarget(dt, sprint) {
    const dir = new THREE.Vector3().subVectors(this.targetPosition, this.character.position);
    dir.y = 0;
    const dist = dir.length();
    
    if (dist > 0.5) {
      dir.normalize();
      this.character.faceDirection.lerp(dir, dt * 8).normalize();
      this.moveToPosition(this.targetPosition, dt, sprint);
    }
  }

  moveToPosition(pos, dt, sprint) {
    const dir = new THREE.Vector3().subVectors(pos, this.character.position);
    dir.y = 0;
    const dist = dir.length();
    
    if (dist > 0.3) {
      dir.normalize();
      const speed = this.character.attributes.speed * (sprint ? 1.2 : 0.8) * (0.7 + this.character.stamina * 0.3);
      const acceleration = 25;
      this.character.velocity.x += dir.x * acceleration * dt;
      this.character.velocity.z += dir.z * acceleration * dt;
      
      const sp = this.character.velocity.length();
      if (sp > speed) this.character.velocity.multiplyScalar(speed / sp);
    } else {
      this.character.velocity.multiplyScalar(0.9);
    }
  }

  moveTowardsRim(dt) {
    const rimSide = this.getTargetRimSide();
    const rimPos = this.match.court.getRimPosition(rimSide);
    this.moveToPosition(rimPos, dt, true);
  }

  faceTarget(targetPos, dt) {
    const dir = new THREE.Vector3().subVectors(targetPos, this.character.position);
    dir.y = 0;
    if (dir.length() > 0.01) {
      dir.normalize();
      this.character.faceDirection.lerp(dir, dt * 10).normalize();
    }
  }

  attemptSteal() {
    this.stealCooldown = 1.5 / this.difficulty;
    if (this.character.trySteal) {
      this.character.trySteal();
    }
  }

  attemptBlock() {
    this.blockCooldown = 1.0 / this.difficulty;
    if (this.character.tryBlock) {
      this.character.tryBlock();
    }
    this.character.jumpV = 5;
    this.character.contestT = 1.0;
  }

  performCrossover() {
    this.crossoverCooldown = 2.0;
    if (this.character.doTrickMove) {
      // AI move variety scales with handles: baggy handlers chain spin/behind-back
      const h = this.character.attributes?.handles || 70;
      const roll = Math.random() * 100;
      const move = h > 90 && roll > 70 ? 'spin'
        : h > 82 && roll > 45 ? 'behind_back'
        : h > 74 && roll > 82 ? 'hesitation'
        : 'crossover';
      this.character.doTrickMove(move);
    } else if (this.character.doCrossover) {
      this.character.doCrossover();
    }
  }

  selectDunk(available) {
    const prefs = this.personality.archetype === 'scorer' ? 
      ['dunk_720', 'backflip', 'windmill', 'tomahawk'] :
      ['tomahawk', 'windmill', 'dunk_360'];
    
    for (const pref of prefs) {
      if (available.includes(pref)) return pref;
    }
    return available[0];
  }

  shouldPass() {
    const teammates = this.match.getTeammates(this.character);
    if (teammates.length === 0) return false;
    
    const openTeammate = teammates.find(t => {
      const defender = this.match.getNearestDefender(t);
      return defender && t.position.distanceTo(defender.position) > 3;
    });
    
    return !!openTeammate && Math.random() < 0.3 * this.difficulty;
  }

  findBestPassTarget() {
    const teammates = this.match.getTeammates(this.character);
    let best = null;
    let bestScore = -1;
    
    teammates.forEach(t => {
      const defender = this.match.getNearestDefender(t);
      const dist = defender ? t.position.distanceTo(defender.position) : 10;
      const score = dist - t.position.distanceTo(this.character.position) * 0.1;
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    });
    
    return best;
  }

  getSpacingPosition() {
    const ballHandler = this.match.ball.holder;
    const rimSide = this.getTargetRimSide();
    const rimPos = this.match.court.getRimPosition(rimSide);
    
    const angle = (this.character.id.hashCode() % 360) * Math.PI / 180;
    const radius = 5 + Math.random() * 3;
    
    return new THREE.Vector3(
      rimPos.x + Math.cos(angle) * radius,
      0,
      rimPos.z + Math.sin(angle) * radius
    );
  }

  getDefensivePosition(ballHandler) {
    const rimSide = this.getTargetRimSide();
    const rimPos = this.match.court.getRimPosition(rimSide);
    
    const toRim = new THREE.Vector3().subVectors(rimPos, ballHandler.position).normalize();
    const defendPos = ballHandler.position.clone().add(toRim.multiplyScalar(1.5));
    defendPos.y = 0;
    
    return defendPos;
  }

  getManDefensePosition() {
    if (!this.assignedMan) return this.character.position.clone();
    
    const rimSide = this.getTargetRimSide();
    const rimPos = this.match.court.getRimPosition(rimSide);
    
    const toMan = new THREE.Vector3().subVectors(this.assignedMan.position, this.character.position).normalize();
    const toRim = new THREE.Vector3().subVectors(rimPos, this.assignedMan.position).normalize();
    
    const defendPos = this.assignedMan.position.clone()
      .add(toMan.multiplyScalar(-2))
      .add(toRim.multiplyScalar(1));
    defendPos.y = 0;
    
    return defendPos;
  }

  getHelpPosition() {
    const ball = this.match.ball.position.clone();
    const rimSide = this.getTargetRimSide();
    const rimPos = this.match.court.getRimPosition(rimSide);
    
    this.helpPosition.lerpVectors(ball, rimPos, 0.4);
    this.helpPosition.y = 0;
    
    return this.helpPosition;
  }

  getZonePosition() {
    const rimSide = this.getTargetRimSide();
    const rimPos = this.match.court.getRimPosition(rimSide);
    
    const zoneX = rimPos.x * 0.5;
    const zoneZ = (this.character.id.hashCode() % 2 === 0 ? 3 : -3);
    
    return new THREE.Vector3(zoneX, 0, zoneZ);
  }

  getRetreatPosition() {
    const rimSide = this.getTargetRimSide();
    const rimPos = this.match.court.getRimPosition(rimSide);
    return rimPos.clone().setY(0);
  }

  getDriveTargetPosition() {
    // attack the rim on the ball-handler's strong side, avoiding the nearest defender
    const rimSide = this.getTargetRimSide();
    const rimPos = this.match.court.getRimPosition(rimSide);
    const defender = this.findNearestDefender();
    const target = rimPos.clone().setY(0);
    if (defender) {
      const away = new THREE.Vector3().subVectors(this.character.position, defender.position).setY(0);
      if (away.lengthSq() > 0.001) target.add(away.normalize().multiplyScalar(1.5));
    }
    return target;
  }

  getTargetRimSide() {
    const pos = this.character.position;
    return Math.abs(pos.x - 12.7) < Math.abs(pos.x + 12.7) ? 'east' : 'west';
  }

  getTargetRim() {
    return this.match.court.getRimPosition(this.getTargetRimSide());
  }

  getDistanceToRim() {
    return this.character.position.distanceTo(this.getTargetRim());
  }

  findNearestDefender() {
    const opponents = this.match.getOpponents(this.character);
    let nearest = null, minDist = Infinity;
    
    opponents.forEach(opp => {
      const dist = this.character.position.distanceTo(opp.position);
      if (dist < minDist) { minDist = dist; nearest = opp; }
    });
    
    return nearest;
  }

  findClosestOffensivePlayer() {
    const opponents = this.match.getOpponents(this.character);
    let closest = null, minDist = Infinity;
    
    opponents.forEach(opp => {
      const dist = this.character.position.distanceTo(opp.position);
      if (dist < minDist) { minDist = dist; closest = opp; }
    });
    
    return closest;
  }

  findNearestOpponentToBall() {
    const opponents = this.match.getOpponents(this.character);
    let nearest = null, minDist = Infinity;
    
    opponents.forEach(opp => {
      const dist = opp.position.distanceTo(this.match.ball.position);
      if (dist < minDist) { minDist = dist; nearest = opp; }
    });
    
    return nearest;
  }

  getTeammates(character) {
    return this.match.getTeammates(character);
  }

  getOpponents(character) {
    return this.match.getOpponents(character);
  }

  dispose() {
    this.assignedMan = null;
  }
}

String.prototype.hashCode = function() {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};