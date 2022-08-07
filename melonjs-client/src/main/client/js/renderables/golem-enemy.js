import { collision, Vector2d } from "melonjs";
import { BaseEnemySprite } from "./base-enemy";
import { ENEMY_TYPES } from "./base-enemy";
import GlobalGameState from "../util/global-game-state";
import NetworkManager from "../util/network";

export default class GolemEnemySprite extends BaseEnemySprite {
	posUpdatedCount = 0;
	VELOCITY = 0.05;

	constructor(x, y) {
		super(x, y, 64, 64, "golem-walk");
		this.enemyType = ENEMY_TYPES.golem;
		

		this.addAnimation("stand-up", [0]);
		this.addAnimation("walk-up", [0, 1, 2, 3, 4, 5, 6], 48);

		this.addAnimation("stand-left", [7]);
		this.addAnimation("walk-left", [7, 8, 9, 10, 11, 12, 13], 48);

		this.addAnimation("stand-down", [14]);
		this.addAnimation("walk-down", [14, 15, 16, 17, 18, 19, 20], 48);

		this.addAnimation("stand-right", [21]);
		this.addAnimation("walk-right", [21, 22, 23, 24, 25, 26, 27], 48);

		this.setCurrentAnimation("stand-left");

		// golems can only walk up/down/left/right
		this.enemyCanWalkDiagonally = false;
	}

	update(dt) {
		if (!this.isStunned) {
			if (!this.nextPositionFound) {				
				this.posUpdatedCount = 0;
				this.calculateNextPosition();
			}
			if (this.nextPositionFound) {
				let posFactor = dt * this.VELOCITY;
				this.pos.x += this.nextPosition.dx * posFactor;
				this.pos.y += this.nextPosition.dy * posFactor;

				// change walking anim if changed
				if (this.nextPosition.last.dx != this.nextPosition.dx || this.nextPosition.last.dy != this.nextPosition.dy) {
					if (this.nextPosition.dx < 0) this.setCurrentAnimation("walk-left", "walk-left");
					else if (this.nextPosition.dx > 0) this.setCurrentAnimation("walk-right", "walk-right");

					if (this.nextPosition.dy < 0) this.setCurrentAnimation("walk-up", "walk-up");
					else if (this.nextPosition.dy > 0) this.setCurrentAnimation("walk-down", "walk-down");
				}

				this.posUpdatedCount += dt;
				posFactor = this.posUpdatedCount * this.VELOCITY;
				if (posFactor >= 32) {
					this.nextPositionFound = false;
					this.posUpdatedCount = 0;
				}

				NetworkManager.getInstance()
					.writeEnemyUpdate(this.nextPosition)
					.catch((err) => console.err("error enemy action: " + err));

			} 
			else {
				// no new position. enemy just stands still

				if (this.nextPosition.dx < 0) this.setCurrentAnimation("stand-left");
				else if (this.nextPosition.dx > 0) this.setCurrentAnimation("stand-right");

				if (this.nextPosition.dy < 0) this.setCurrentAnimation("stand-up");
				else if (this.nextPosition.dy > 0) this.setCurrentAnimation("stand-down");
			}
		}
		super.update(dt);
		return true;
	}

	onCollision(response, other) {
		if (other.body.collisionType === collision.types.PROJECTILE_OBJECT) {
			if (other.isExploding) {
				this.isStunned = true;
				if (this.nextPosition.dx < 0) this.setCurrentAnimation("stand-left");
				else if (this.nextPosition.dx > 0) this.setCurrentAnimation("stand-right");

				if (this.nextPosition.dy < 0) this.setCurrentAnimation("stand-up");
				else if (this.nextPosition.dy > 0) this.setCurrentAnimation("stand-down");

				this.flicker(GlobalGameState.enemyStunnedTime, () => {
					this.isStunned = false;
					GlobalGameState.stunnedGolems++;
					GlobalGameState.score += GlobalGameState.scoreForStunningGolem;
				});
			}
		} 
		else if (other.body.collisionType === collision.types.PLAYER_OBJECT && !this.isDead && !this.isStunned && !GlobalGameState.invincible) {
			if (this.nextPosition.dx < 0) this.setCurrentAnimation("stand-left");
			else if (this.nextPosition.dx > 0) this.setCurrentAnimation("stand-right");

			if (this.nextPosition.dy < 0) this.setCurrentAnimation("stand-up");
			else if (this.nextPosition.dy > 0) this.setCurrentAnimation("stand-down");

		}
		return false;
	}
}