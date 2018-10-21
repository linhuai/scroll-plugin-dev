function Scroll (el, options) {
	this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
	this.scroller = this.wrapper.children[0];
	this.scrollerStyle = this.scroller.style;		// cache style for better performance

  // 需要添加判断是否已经开始 
  this.pointY = 0

  this.isMoving = false
	this.options = {
		startX: 0,
		startY: 0,
		scrollY: true,
		directionLockThreshold: 5,
		momentum: true,

		bounce: true,
		bounceTime: 600,
		bounceEasing: ''
	};

	for ( var prop in options ) {
		this.options[prop] = options[prop];
	}

	// Some defaults
	this.x = 0;
	this.y = 0;
	this.directionX = 0;
	this.directionY = 0;
	this._events = {};

  // INSERT POINT: DEFAULTS

	this._init();
	this.refresh();

	// this.scrollTo(this.options.startX, this.options.startY);
}

Scroll.prototype._init = function () {
  this._initEvents()
}

Scroll.prototype.refresh = function () {
  function getRect (el) {
    return {
      top : el.offsetTop,
      left : el.offsetLeft,
      width : el.offsetWidth,
      height : el.offsetHeight
    }
  }

  function offset (el) {
		var left = -el.offsetLeft,
			top = -el.offsetTop;

		while (el = el.offsetParent) {
			left -= el.offsetLeft;
			top -= el.offsetTop;
		}

		return {
			left: left,
			top: top
		}
  }
		this.wrapperWidth	= this.wrapper.clientWidth;
		this.wrapperHeight	= this.wrapper.clientHeight;

		var rect = getRect(this.scroller);

		this.scrollerWidth	= rect.width;
		this.scrollerHeight	= rect.height;

		this.maxScrollX		= this.wrapperWidth - this.scrollerWidth;
		this.maxScrollY		= this.wrapperHeight - this.scrollerHeight;
		

		this.endTime = 0;
		this.directionX = 0;
		this.directionY = 0;
		this.wrapperOffset = offset(this.wrapper);
}

Scroll.prototype.scrollTo = function (x, y, time, easing) {
  easing = easing || {
    style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
    fn: function (k) {
      return Math.sqrt( 1 - ( --k * k ) );
    }
  }
  this._animate(x, y, time, easing.fn);
}

Scroll.prototype._translate = function (x, y) {
  console.log('-transform', x, y)
  x = 0
  this.scrollerStyle['transform'] = 'translate(' + x + 'px,' + y + 'px)';

  this.x = x;
  this.y = y;

// INSERT POINT: _translate

},

Scroll.prototype._animate = function (destX, destY, duration = 0, easingFn) {
  var that = this,
    startX = this.x,
    startY = this.y,
    startTime = new Date().getTime(),
    destTime = startTime + duration;

  function step () {
    var now = new Date().getTime(),
      newX, newY,
      easing;

    if ( now >= destTime ) {
      that._translate(destX, destY);
      return;
    }

    now = ( now - startTime ) / duration;
    easing = easingFn(now);
    newX = ( destX - startX ) * easing + startX;
    newY = ( destY - startY ) * easing + startY;
    that._translate(newX, newY);
    rAF(step);
  }

  this.isAnimating = true;
  step();
}

Scroll.prototype.handleEvent = function (e) {
  switch ( e.type ) {
    case 'touchstart':
    case 'mousedown':
      this._start(e);
      break;
    case 'touchmove':
    case 'mousemove':
      this._move(e);
      break;
    case 'touchend':
    case 'mouseup':
      this._end(e);
      break;
  }
}

Scroll.prototype._initEvents = function (remove) {
  function addEvent (target, type, handle) {
    target.addEventListener(type, handle)
  }
  function removeEvent (target, type, handle) {
    target.removeEventListener(type, handle)
  }

  let target = this.wrapper

  addEvent(target, 'mousedown', this)
  addEvent(target, 'mousemove', this)
  addEvent(target, 'mouseup', this)

  addEvent(target, 'touchstart', this)
  addEvent(target, 'touchmove', this)
  addEvent(target, 'touchend', this)
}

Scroll.prototype._start = function (e) {
  this.isMoving = true
  var point = e.touches ? e.touches[0] : e,
    pos;
  this.moved		= false;
  this.distX		= 0;
  this.distY		= 0;
  this.directionX = 0;
  this.directionY = 0;
  this.directionLocked = 0;

  // this.startTime = utils.getTime();

  this.startX    = this.x;
  this.startY    = this.y;
  this.absStartX = this.x;
  this.absStartY = this.y;
  this.pointX    = point.pageX;
  this.pointY    = point.pageY;
}

Scroll.prototype._move = function (e) {
  if (!this.isMoving) return false
		var point		= e.touches ? e.touches[0] : e,
			deltaX		= point.pageX - this.pointX,
			deltaY		= point.pageY - this.pointY,
			timestamp	= new Date().getTime(),
			newX, newY,
      absDistX, absDistY;

		this.pointX		= point.pageX;
		this.pointY		= point.pageY;
		this.distX		+= deltaX;
		this.distY		+= deltaY;
		absDistX		= Math.abs(this.distX);
		absDistY		= Math.abs(this.distY);
		// We need to move at least 10 pixels for the scrolling to initiate
		if ( timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10) ) {
			return;
		}

		newX = this.x + deltaX;
		newY = this.y + deltaY;

		// Slow down if outside of the boundaries
		if ( newX > 0 || newX < this.maxScrollX ) {
			newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
		}
		if ( newY > 0 || newY < this.maxScrollY ) {
			newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
		}

		this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
		this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

		this.moved = true;
		this._translate(newX, newY);

/* REPLACE START: _move */

		if ( timestamp - this.startTime > 300 ) {
			this.startTime = timestamp;
			this.startX = this.x;
			this.startY = this.y;
		}

}

Scroll.prototype._end = function (e) {
  this.isMoving = false
		var point = e.changedTouches ? e.changedTouches[0] : e,
			momentumX,
			momentumY,
			duration = new Date().getTime() - this.startTime,
			newX = Math.round(this.x),
			newY = Math.round(this.y),
			distanceX = Math.abs(newX - this.startX),
			distanceY = Math.abs(newY - this.startY),
			time = 0,
			easing = '';

		this.endTime = new Date().getTime();

		// reset if we are outside of the boundaries
		// if ( this.resetPosition(this.options.bounceTime) ) {
		// 	return;
		// }

    // this.scrollTo(newX, newY);	// ensures that the last position is rounded
    
		// start momentum animation if needed
		if ( this.options.momentum && duration < 300 ) {
			momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
			momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };
			newX = momentumX.destination;
			newY = momentumY.destination;
			time = Math.max(momentumX.duration, momentumY.duration);
			this.isInTransition = 1;
		}


		if ( newX != this.x || newY != this.y ) {
			// change easing function when scroller goes out of the boundaries
			if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
				// easing = utils.ease.quadratic;
			}

			this.scrollTo(newX, newY, time, easing);
			return;
		}
}

function log (...msgs) {
  for(let i = 0, len = msgs.length; i < len; i++) {
    console.log(`[scroll log]${msgs[i]}`)
  }
}
