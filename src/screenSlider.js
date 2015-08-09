(function(global,DOC){

	var W3C = DOC.dispatchEvent;
	var ie678 =  '\v' == 'v';
	var ie9 = DOC.documentMode && DOC.documentMode === 9;
	var ielow = ie678 || ie9;

	var hasOwn = Object.prototype.hasOwnProperty;
	var isMobile = /iPad|iPhone|android/i.test(navigator.userAgent);

	var bind = W3C ? function(el, type, fn, phase) {
            el.addEventListener(type, fn, !!phase);
            return fn;
        } : function(el, type, fn) {
            el.attachEvent && el.attachEvent("on" + type, fn);
            return fn;
        };

	var unbind = W3C ? function(el, type, fn, phase) {
            el.removeEventListener(type, fn || $.noop, !!phase);
        } : function(el, type, fn) {
            if (el.detachEvent) {
                el.detachEvent("on" + type, fn || $.noop);
            }
      	};

	function getById(el,idName){
    if(arguments.length==1){
      idName = el;
      el = DOC;
    }
    return el.getElementById(idName);
  }
  function getByClass(el,className){
    if(arguments.length==1){
      className = el;
      el = DOC;
    }
    return el.getElementsByClassName(className);
  }
	function getByToggler(el,status){
		if(arguments.length==1){
			status = el;
			el = DOC;
		}
		if(DOC.querySelectorAll){
			return el.querySelectorAll('*[toggler-'+ status + ']');
		}else{
			var result = [];
			var children = el.getElementsByTagName("*");
			for (var i = 0; i < children.length; i++) {
				var toggler = children[i].getAttribute('toggler-'+status);
				if(toggler && toggler!=''){
					result.push(children[i]);
				}
			}
			return result;
		}
	}

  function classReg(className){
    return new RegExp("(^|\\s+)"+className+"(\\s|$)");
  }
  var hasClass,addClass,removeClass,togglerClass;
  if('classList' in DOC.documentElement){
    hasClass=function(el,c){return el.classList.contains(c);}
    addClass=function(el,c){el.classList.add(c);}
    removeClass=function(el,c){el.classList.remove(c);}
  }else{
    hasClass=function(el,c){
			return classReg(c).test(el.className);
		}
    addClass=function(el,c){
      if(!hasClass(el,c)){
        el.className +=' '+c;
      }
    }
    removeClass=function(el,c){
      if(hasClass(el,c)){
        el.className = el.className.replace(classReg(c),' ');
      }
    }
  }
togglerClass = function(el,c){
	var fn = hasClass(el,c)?removeClass:addClass;
	fn(el,c);
}

var debounce = function(delay,callback){
	var timer = null;
	var args,context;
	return function(){
		context = this;
		args = arguments;
		clearTimeout(timer);

		timer = setTimeout(function(){
			callback.apply(context,args);
			timer = null;
		},delay);
	}
}

function getEvent(event){
	if(isMobile && event.touches.length){
		return event.touches[0];
	}
	return 	event ? event : window.event;
}

function getTarget(event){
	event = getEvent(event);
	return event.target || event.srcElement;
}

function getWheelDelta (event) {
	if(event.wheelDelta) {
	     return  event.wheelDelta;
	}else {
	    return -event.detail * 40
	}
}

	function ScreenSlider(opts){
		  opts = opts || {};
			this.$container = getById(opts.container||'container');                   //container
			this.$items = getByClass(this.$container,opts.items||'item');							//item类
			this.activeClass = opts.activeClass || 'item-active';											//item toggler类
			this.orientation = opts.orientation || 'vertical';												//滚动方向
			this.onPresent = opts.onPresent || this.noop; 														//展示item的回调
			this.onDismiss = opts.onDismiss || this.noop; 														//隐藏item的回调
			this.onResize = opts.onResize || this.noop; 															//窗口resize时调用函数
			this.repeat = opts.repeat || false; 																			//是否可以从最后一页回到第一页
			this.duration = opts.duration || 500;																			//滑动时间
			this.resizeDelay = opts.resizeDelay || 30;																//resize 延迟执行时间（debounce）
			this.scrollWheelDelay = opts.scrollWheelDelay || 200;											//滚轮延迟执行时间(debounce)

			this.pager = getById(opts.pager || 'pager');															//pager
			this.pagerDistance = opts.pagerParam || 40;																//pager item距离
			this.pagerOrientation = opts.pagerOrientation || 'vertical';							//pager 显示方向
			this.pagerIndicator = this.pager &&
														getByClass(this.pager,"pager-current-indicator")[0];//pager 当前item指示元素


			this.current = 0;

			this._length = this.$items.length;
			this._size = 0;
			this._itemsState = [];
			this._factory = [];

			this.init();
			this.setup();
	}

	ScreenSlider.prototype.init = function(){
		this._size = this.orientation === 'vertical'? this.$container.offsetHeight : this.$container.offsetWidth;
		this._plantform = this.configPlantform();
		this.present(this.current,'noop',true);
	}

	ScreenSlider.prototype.setup = function(){
		this.handerTouch();
		this.handlerPager();
		this.on('onPresent',this.onPresent);
		this.on('onDismiss',this.onDismiss);
	}

	ScreenSlider.prototype.present = function(i,type,immediate){
		var that = this;
		this.current = i;
		var item = this.$items[this.current];
		if(this._itemsState[i]!==1){
			this._itemsState[i] = 1;
			item.style.position = 'absolute';
			item.style.left = '0px';
			item.style.top = '0px';
			item.style.width = this.$container.offsetWidth + 'px';
			item.style.height = this.$container.offsetHeight + 'px';
		}
		addClass(item,this.activeClass);
		var anim = this.transform();
		anim[type](item);
		that.toggler(item,'present',immediate);
	}

	ScreenSlider.prototype.dismiss = function (i,type) {
		var item = this.$items[i];
		var anim = this.transform();
		this.toggler(item,'dismiss',true);
		removeClass(item,this.activeClass);
		anim[type](item);
	};

	ScreenSlider.prototype.toggler = function(el,type,immediate){
		var that = this;
		var _plantform = this._plantform;
		var childrens = getByToggler(el,this._plantform);
		if(immediate){
			handle();
		}else{
			setTimeout(handle,this.duration);
		}

		function handle(){
			for(i=0;i<childrens.length;i++){
				var child = childrens[i];
				var clazz = child.getAttribute('toggler-'+ _plantform);
				if(!clazz){
					continue;
				}
				clazz = clazz.split(" ");
				for(var j=0;j<clazz.length;j++){
					var cl = clazz[j];
					if(cl == ''){
						continue;
					}
					if(type === 'present'){
						addClass(child,cl);
						that.emit('onPresent',that.current);
					}else{
						removeClass(child,cl);
						that.emit('onDismiss',i);
					}
				}
			}
		}
	}

	ScreenSlider.prototype.on = function(name,callback){
		if(typeof callback !== 'function'){
			throw 'parameter callback must be a function';
		}else if(this._factory[name]){
			throw 'event'+ name + 'was registered'
		}
		this._factory = callback;
		return this;
	}

	ScreenSlider.prototype.emit = function(name){
		var args = Array.prototype.slice.call(arguments).slice(1);
		var callback = this._factory[name];
		if(callback){
			callback.apply(this,args);
		}
	}

	ScreenSlider.prototype.configPlantform = function(){
		if(this.$container.offsetWidth>768){
			return 'desktop';
		}else{
			return 'mobile';
		}
	}

	ScreenSlider.prototype.noop = function(){};

	ScreenSlider.prototype.handerTouch = function(i){
		var that = this;
		//touch or mouse 事件
		var startEvent = isMobile?'touchstart':'mousedown';
		var endEvent = isMobile?'touchend':'mouseup';
		var moveEvent = isMobile?'touchmove':'mousemove'
		var startPoint,endPoint,target,edgeChange;
		bind(this.$container,startEvent,function(e){
			if(that.orientation === 'vertical'){
				startPoint = getEvent(e).pageY;
			}else{
				startPoint = getEvent(e).pageX;
			}
		});
		bind(this.$container,moveEvent,function(e){
			if(that.orientation === 'vertical'){
				endPoint = getEvent(e).pageY;
			}else{
				endPoint = getEvent(e).pageX;
			}
		})
		bind(this.$container,endEvent,function(e){

			//if(that.orientation === 'vertical'){
			//	endPoint = getEvent(e).pageY;
			//}else{
			//	endPoint = getEvent(e).pageX;
			//}
			//touch好像无法拿到endEvent的位置，所以放在了moveEvent中
			if(Math.abs(endPoint-startPoint)<10){
				return; //距离太小默认为是点击
			}
			target = (startPoint - endPoint > 0) ? that.current+1 : that.current -1;
			edgeChange = parseEdge(target);
			target = parseTarget(target);

			that.pagerTo(target,edgeChange);
		});
		//滚轮事件
		var debounceScrollWheel = debounce(that.scrollWheelDelay,handleMouseWheel);
		bind(this.$container,'mousewheel',debounceScrollWheel);
		bind(this.$container,'DOMMouseScroll',debounceScrollWheel);
		function handleMouseWheel(e){
			var event = getEvent(e);
			var delta = getWheelDelta(event);
			var target,edgeChange;
			target = delta>0 ? that.current+1 : that.current -1;
			edgeChange = parseEdge(target);
			target = parseTarget(target);
			that.pagerTo(target,edgeChange);
		}
		function parseEdge(target){
			return that.repeat && (target<0 || target>=that._length) ? true:false;
		}
		function parseTarget(target){
			target = target<0?(that.repeat?that._length-1:-1):target>=that._length?
									(that.repeat?0:-1):target; //target 返回-1则不做任何变化
			return target;
		}
		//resize事件
		bind(global,'resize',debounce(that.resizeDelay,resize));
		function resize(e){
			if(that.configPlantform() !== that._plantform){
				that.toggler(that.$items[that.current],'dismiss',true);
				that._plantform = that.configPlantform();
				that.setup();
			}
			that._itemsState = [];
			setTimeout(function(){
				that.onResize();
				that.init();
			},0)

		}
	}

	ScreenSlider.prototype.handlerPager = function () {
		//1.如果不存在pager,直接返回
		if(!this.pager){
			return;
		}
		//2.存在pager,则绑定点击事件
		var that = this;
		var pagerList = getByClass(this.pager,"pager-list-item");
		for(var i=0;i<pagerList.length;i++){
			(function(){
						var j=i;
						var item = pagerList[j];
					item.onclick = function(){
						that.pagerTo(j);
					}
			})();
		}
		//3.如果不存在pagerIndicator,返回
		if(!this.pagerIndicator){
			return;
		}
		//4.如果存在pagerIndicator,则根据pagerOrientation控制显示位置
		var type = this.pagerOrientation == "horizontal"?"left" : "top";
		this.pagerIndicator.style.top = this.current * this.pagerDistance + 'px';
		this.pagerIndicator.style.display = "block";
	};

	//动画
	ScreenSlider.prototype.moveTo = function(target,edgeChange){
		if(target == -1){
			return;
		}
		var now = this.current;
		var isFront = target - now > 0 ? true : false;
		var dType = isFront?(edgeChange?'frontOut':'backOut'): (edgeChange?'backOut':'frontOut');
		var pType = isFront?(edgeChange?'backIn':'frontIn'): (edgeChange?'frontIn':'backIn');
		this.present(target,pType);
		this.dismiss(now,dType);
	}

	ScreenSlider.prototype.pagerTo = function (target,edgeChange) {
		if(this.pager && this.pagerIndicator){
			//如果存在pagerIndicator,则对pagerIndicator做动画并对item做动画
			var type = this.pagerOrientation == "horizontal" ? "left" : 'top';
			animByPosition(this.pagerIndicator,type,this.pagerDistance*this.current,this.pagerDistance*target,2,30);
			this.moveTo(target,edgeChange);
		}else{
			//不存在pagerIndicator,则直接对item做动画
			this.moveTo(target,edgeChange);
		}

	};

	ScreenSlider.prototype.transform  = function(){
		var that = this;
		if(ielow){
			return {
				frontIn:function(item){
					that.animByPosition(item,that._size,0);
				},
				frontOut:function(item){
					that.animByPosition(item,0,that._size);
				},
				backIn:function(item){
					that.animByPosition(item,-1*that._size,0);
				},
				backOut:function(item){
					that.animByPosition(item,0,-1*that._size);
				},
				noop :function(item){
						item.style.left = '0px';
						item.style.top = '0px';
				}
			}
		}
		console.log("ff");
		return {
			frontIn:function(item){
				that.animByTransform(item,that._size,0);
			},
			frontOut:function(item){
				that.animByTransform(item,0,that._size);
			},
			backIn:function(item){
				that.animByTransform(item,-1*that._size,0);
			},
			backOut:function(item){
				that.animByTransform(item,0,-1*that._size);
			},
			noop :function(item){
					var transform = 'translate3d(0, 0, 0)';
					transformWriter(item,transform);
			}
		}
	}

	ScreenSlider.prototype.animByPosition = function(item,start,end){
		var that = this;
		if(this.orientation === 'vertical'){
			item.style.left="0px";
			animByPosition(item,'top',start,end,1,this.duration);
		}else{
			item.style.top="0px";
			animByPosition(item,'left',start,end,2,this.duration);
		}
	}

	ScreenSlider.prototype.animByTransform = function(item,start,end){
		var that = this;
		if(this.orientation === 'vertical'){
			var transformStr = 'translate3d(0, ' + start + 'px, 0)';
			transformWriter(item,transformStr);
			transitionWriter(item,0);
			//先要初始化位置
			//var tmp = item.style.transform;//读一次元素，强制刷新界面，直接这样不起作用。。
			setTimeout(function(){
				transformStr = 'translate3d(0, ' + end + 'px, 0)';
				transitionWriter(item,that.duration);
				transformWriter(item,transformStr);
			},30) //给一定的时间确保初始化位置完成

		}else{
			var transformStr = 'translate3d('+ start +'px, 0, 0)';
			transitionWriter(item,0);
			transformWriter(item,transformStr);
			setTimeout(function(){
				transformStr = 'translate3d('+ end +'px, 0, 0)';
				transitionWriter(item,that.duration);
				transformWriter(item,transformStr);
			},10)

		}
	}

	function transformWriter(item,transform){
		item.style['-webkit-transform'] = transform;
		item.style['-ms-transform'] = transform;
		item.style.transform = transform;
	}

	function transitionWriter(item,duration){
		item.style['-webkit-transition'] = duration + 'ms';
		item.style['-ms-transition'] = duration + 'ms';
		item.style.transition = duration + 'ms';
	}

	function animByPosition(item,type,start,end,speed,duration){
		if(item.timer){
			clearTimeout(item.timer);
			item.itemer = null;
		}
		var cellTime =  duration/speed;
		var style = item.style;
		style[type] = start + 'px';
		speed = (start>end && speed>0) ? -1*speed : (speed<0?-1*speed:speed);
		var positive = speed >=0 ? true : false;
		item.timer = function(){
			start += speed;
			style[type] = start + 'px';
			if((start>=end && positive)||(start<=end && !positive)){
				console.log('fuck');
				style[type] = end + 'px';
				clearTimeout(item.timer);
				item.timer = null;
			}
			setTimeout(item.timer,cellTime);
		}
		item.timer();
	}

	global.ScreenSlider = ScreenSlider;

	global.tool = {
		getById:getById,
		getByClass:getByClass,
		getByToggler:getByToggler,
		bind:bind,
		unbind:unbind,
		hasClass:hasClass,
		addClass:addClass,
		removeClass:removeClass,
		togglerClass:togglerClass,
		transformWriter:transformWriter,
		transitionWriter:transitionWriter,
		getEvent:getEvent,
		getTarget:getTarget,
		animByPosition:animByPosition
	}
})(self,self.document);
