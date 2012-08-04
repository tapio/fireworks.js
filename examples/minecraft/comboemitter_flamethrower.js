Fireworks.ComboEmitter.Flamethrower	= function(opts){
	this._container	= opts.container|| console.assert(false, "container MUST be defined");
	// init parameters
	this._loop	= opts.loop	|| tQuery.world.loop();
	this._onReady	= opts.onReady	|| function(comboEmitter){};
	this._imagesUrl	= opts.imagesUrl|| '../assets/images/flame/';
	this._soundsUrl	= opts.soundsUrl|| 'sounds/';


	// init sound if availble	
	if( WebAudio.isAvailable ){
		this._webaudio	= opts.webaudio	|| new WebAudio();
		this._baseSound	= null;
		this._sound	= null;		
	}
	
	this._emitter	= null;	
	this._source3D	= null;
	this._target3D	= null;
	
	// data to handle attackTime/releaseTime
	this._state	= 'stopped';
	this._lastStart	= 0;
	this._lastStop	= 0;
	this._attackTime	= 1.0;
	this._releaseTime	= 0.3;
	
	// contruct each parts
	this._emitterCtor();
	WebAudio.isAvailable && this._soundCtor();

	// update the emitter in rendering loop
	this._$loopCb	= this._loop.hook(this._loopCb.bind(this));
}

Fireworks.ComboEmitter.Flamethrower.prototype._destroy	= function()
{
	this._loop.unhook(this._$loopCb);
	this._emitterDtor();
	WebAudio.isAvailable && this._soundDtor();
}

// inherit from Fireworks.ComboEmitter
Fireworks.ComboEmitter.Flamethrower.prototype			= new Fireworks.ComboEmitter();
Fireworks.ComboEmitter.Flamethrower.prototype.constructor	= Fireworks.ComboEmitter.Flamethrower;

//////////////////////////////////////////////////////////////////////////////////
//		Getter								//
//////////////////////////////////////////////////////////////////////////////////

Fireworks.ComboEmitter.Flamethrower.prototype.start	= function(){
	if( this._state === 'started' )	return;
	console.assert( this._state === 'stopped' )
	this._state	= 'started';
	this._lastStart	= Date.now()/1000;
}

Fireworks.ComboEmitter.Flamethrower.prototype.stop	= function(){
	if( this._state === 'stopped' )	return;
	console.assert( this._state === 'started' );
	this._state	= 'stopped';
	this._lastStop	= Date.now()/1000;
};

Fireworks.ComboEmitter.Flamethrower.prototype.ungracefullStop	= function(){
	this._state	= 'stopped';
	this._lastStop	= 0;
};

/**
 * @return {boolean} true if it is ready, false otherwise
*/
Fireworks.ComboEmitter.Flamethrower.prototype.isReady	= function(){
	// test if the sound has been loaded
	if( !this._baseSound.isPlayable() )	return false;
	// test the spritesheet has been loaded
	if( !this._emitter )			return false;
	// if all previous tests passed, it is ready
	return true;
};

Fireworks.ComboEmitter.Flamethrower.prototype._notifyReadyIfPossible	= function(){
	if( this.isReady() === false )	return;
	this._onReady(this);
};

//////////////////////////////////////////////////////////////////////////////////
//		Getter								//
//////////////////////////////////////////////////////////////////////////////////

Fireworks.ComboEmitter.Flamethrower.prototype.object3D	= function(){
	return this._container;
};

Fireworks.ComboEmitter.Flamethrower.prototype.source3D	= function(value){
	if( value === undefined )	return this._source3D;
	console.assert(value instanceof THREE.Object3D);
	this._source3D	= value;
	return this;
};

Fireworks.ComboEmitter.Flamethrower.prototype.target3D	= function(value){
	if( value === undefined )	return this._source3D;
	console.assert(value instanceof THREE.Object3D);
	this._target3D	= value;
	return this;
};

Fireworks.ComboEmitter.Flamethrower.prototype.sound	= function(){
	return this._baseSound;
};
//////////////////////////////////////////////////////////////////////////////////
//		rendering loop function						//
//////////////////////////////////////////////////////////////////////////////////


Fireworks.ComboEmitter.Flamethrower.prototype._loopCb	= function(delta, now){
	// if this.is_ready() is false, return now
	if( this.isReady() === false ) return;
	
	// update and render this._emitter
	this._emitter.update(delta).render();

	// handle intensity depending on attackTime/releaseTime
	console.assert( this._state === 'started' || this._state === 'stopped' );	
	var present	= Date.now()/1000;
	if( this._state === 'started' ){
		if( present - this._lastStart <= this._attackTime ){
			var intensity	= (present - this._lastStart) / this._attackTime;		
		}else{
			var intensity	= 1;
		}
		this._emitter.intensity( intensity );
	}else if( this._state === 'stopped' ){
		if( present - this._lastStop <= this._releaseTime ){
			var intensity	= 1 - (present - this._lastStop) / this._releaseTime;			
		}else{
			var intensity	= 0;
		}
		this._emitter.intensity( intensity );
	}

	// if target3D and source3D are defined, use it to set velocity
	// TODO should i recompute the matrixWorld ??
	if( this._target3D && this._source3D ){
		var posSource	= this._source3D.matrixWorld.getPosition().clone();
		var posTarget	= this._target3D.matrixWorld.getPosition().clone();
		var velocity	= posTarget.subSelf(posSource);
		velocity.multiplyScalar(1/this.object3D().scale.x)
		this._emitter.effect('velocity').opts.shape.position.copy(velocity);	
	}

	// if this._source3D is defined, use it for setting position
	// TODO should i recompute the matrixWorld ??
	if( this._source3D ){
		var posSource	= this._source3D.matrixWorld.getPosition().clone();
		var posContainer= this._container.matrixWorld.getPosition().clone();
		var position	= posSource.subSelf(posContainer);
		position.multiplyScalar(1/this.object3D().scale.x);
		this._emitter.effect('position').opts.shape.position.copy(position);	
	}

	// set gravity in local space
	// TODO should i recompute the matrix ??
	var effect	= this._emitter.effect('gravity');
	var position	= effect.opts.shape.position.set(0, 10, 0);
	position.multiplyScalar(1/this.object3D().scale.x)
	var matrix	= this._container.matrixWorld.clone().setPosition({x:0,y:0,z:0}).transpose();
	matrix.multiplyVector3(position);
}


//////////////////////////////////////////////////////////////////////////////////
//		Flame jet emitter						//
//////////////////////////////////////////////////////////////////////////////////

/**
 * Create the flame jet
*/
Fireworks.ComboEmitter.Flamethrower.prototype._emitterCtor	= function(){
	var urls	= [
		// this._imagesUrl + "flame00.png",
		// this._imagesUrl + "flame01.png",
		this._imagesUrl + "flame02.png",
		this._imagesUrl + "flame03.png",
		this._imagesUrl + "flame04.png",
		this._imagesUrl + "flame05.png",
		this._imagesUrl + "flame06.png",
		this._imagesUrl + "flame07.png",
		this._imagesUrl + "flame08.png",
		this._imagesUrl + "flame09.png",
		this._imagesUrl + "flame10.png",
		this._imagesUrl + "flame11.png",
		this._imagesUrl + "flame12.png",
		this._imagesUrl + "flame13.png",
		this._imagesUrl + "flame14.png",
		this._imagesUrl + "flame15.png",
		this._imagesUrl + "flame16.png",
		this._imagesUrl + "flame17.png",
		this._imagesUrl + "flame18.png",
		this._imagesUrl + "flame19.png",
		this._imagesUrl + "flame20.png",
		this._imagesUrl + "flame21.png",
		this._imagesUrl + "flame22.png",
		this._imagesUrl + "flame23.png",
		this._imagesUrl + "flame24.png"
	];


	loadTremulousFlameParticule(urls, buildEmitter.bind(this));
	return;

	function buildEmitter(texture){
		//console.log("spriteSheet loaded");
		var cemitter	= this;
		var emitter	= this._emitter	= Fireworks.createEmitter({nParticles : 100})
			.effectsStackBuilder()
				.spawnerSteadyRate(20)
				.position(Fireworks.createShapeSphere(0, 0,   0, 0.01))
				.velocity(Fireworks.createShapeSphere(0, 0, -30, 0.1), 30)
				.lifeTime(0.8, 1.5)
				.friction(0.98)
				.acceleration({
					effectId	: 'gravity',
					shape		: Fireworks.createShapePoint(0, 10, 0)
				})
				.randomVelocityDrift(Fireworks.createVector(0,0,20))
				.createEffect('scale', {
						origin	: 1/8,
						factor	: 1.005
					}).onBirth(function(particle){
						var object3d	= particle.get('threejsObject3D').object3d;
						var scale	= this.opts.origin * cemitter.object3D().scale.x;
						object3d.scale.set(scale, scale, scale)
					}).onUpdate(function(particle, deltaTime){
						var object3d	= particle.get('threejsObject3D').object3d;
						object3d.scale.multiplyScalar(this.opts.factor);
					}).back()
				.createEffect('rotation')
					.onBirth(function(particle){
						var object3d	= particle.get('threejsObject3D').object3d;
						object3d.rotation	= Math.random()*Math.PI*2;
					}).back()
				.renderToThreejsObject3D({
					container	: this._container,
					create		: function(){
						var object3d	= new THREE.Sprite({
							//color			: 0xffaacc,
							useScreenCoordinates	: false,
							map			: texture,
							blending		: THREE.AdditiveBlending,
							transparent		: true,
							depthTest		: false,
							depthWrite		: false
						});
						object3d.opacity	= 0.5;
						object3d.uvScale.set(1, 1/urls.length);
						return object3d;
					}
				})
				.createEffect("spriteSheetAnimation")
					.onUpdate(function(particle, deltaTime){
						var object3d	= particle.get('threejsObject3D').object3d;
						var canonAge	= particle.get('lifeTime').normalizedAge();
						var imageIdx	= Math.floor(canonAge * (urls.length));
						var uvOffsetY	= imageIdx * 1/urls.length;
						object3d.uvOffset.set(0, uvOffsetY)
					}).back()
				.createEffect("soundIntensity")
					.onIntensityChange(function(newIntensity, oldIntensity){
						this._soundSetIntensity(newIntensity, oldIntensity);
					}.bind(this)).back()
				.createEffect("spawnerIntensity")
					.onIntensityChange(function(newIntensity, oldIntensity){
						var spawner	= this.emitter().effect('spawner');
						if( newIntensity === 0 ){
							spawner.opts.stop();
						}
						if( oldIntensity === 0 && newIntensity > 0 ){
							spawner.opts.start();
						}
					}).back()
				.back()
			.start();
		emitter.intensity(0);
		// notify the caller it is ready if possible
		this._notifyReadyIfPossible();
	};
	
	//////////////////////////////////////////////////////////////////////////
	//		misc helpers						//
	//////////////////////////////////////////////////////////////////////////
	function loadTremulousFlameParticule(urls, onReady){
		// load all the images from urls
		tQuery.TextureUtils.loadImages(urls, function(images, urls){
			// build a tiled spreadsheet canvas with images
			var canvas	= tQuery.TextureUtils.buildTiledSpriteSheet({
				images	: images,
				spriteW	: images[0].width,
				spriteH	: images[0].height,
				nSpriteX: 1
			});
			// create the texture
			var texture	= new THREE.Texture( canvas );
			texture.needsUpdate = true;
			// generate Alpha as it got no alpha 
			tQuery.TextureUtils.generateAlphaFromLuminance(texture, 16, 1);
			// notify caller
			onReady(texture, urls)
		})
	}
}

Fireworks.ComboEmitter.Flamethrower.prototype._emitterDtor	= function(){
}


//////////////////////////////////////////////////////////////////////////////////
//		sound								//
//////////////////////////////////////////////////////////////////////////////////

Fireworks.ComboEmitter.Flamethrower.prototype._soundCtor	= function()
{
	// create a sound 
	this._baseSound	= this._webaudio.createSound().loop(true);	
	// load the sound
	this._baseSound.load(this._soundsUrl + 'flamethrower-freesoundloop.wav', function(sound){
		// notify the caller it is ready if possible
		this._notifyReadyIfPossible();
	}.bind(this));
}

Fireworks.ComboEmitter.Flamethrower.prototype._soundDtor	= function()
{
	this._sound	&& this._sound.stop();
	this._baseSound.destroy();
}

Fireworks.ComboEmitter.Flamethrower.prototype._soundSetIntensity= function(newIntensity, oldIntensity)
{
	// if WebAudio isnt available, do nothing
	if( WebAudio.isAvailable === false )	return;
	//console.log('isPlayable', this._baseSound.isPlayable())
	// if sound isnt yet playable (like not loaded), return now
	if( this._baseSound.isPlayable() === false )	return;
	
	if( newIntensity > 0 && this._sound === null ){
		this._sound	= this._baseSound.play();
	}

	var sound	= this._sound;
	sound.node.playbackRate.value	= 0.5+newIntensity*1.5;
	sound.node.gain.value		= newIntensity*3;
}





