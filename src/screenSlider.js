(function(global,DOC){

	var W3C = DOC.dispatchEvent;
	var ie678 =  '\v' == 'v';
	var ie9 = DOC.documentMode && DOC.documentMode == 9;
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

	var timer = null;
	var debounce = function(delay,callback){
		clearTimeout(timer);
		timer = setTimeout(function(){
			callback();
			timer = null;
		},delay);
	}

	function getEvent(event){
		return event ? event : window.event;
	}

	function getTarget(event){
		event = getEvent(event);
		return event.target || event.srcElement;
	}

	function ScreenSlider(opts){
		  opts = opts || {};
			this.$container = getById(opts.container||'container');//container
			this.$items = getByClass(this.$container,opts.items||'item');//item类
			this.activeClass = opts.activeClass || 'item-active';//item toggler类
			this.orientation = opts.orientation || 'vertical';//滚动方向
			this.onPresent = opts.onPresent || this.noop; //展示item的回调
			this.onDismiss = opts.onDismiss || this.noop; //隐藏item的回调
			this.onResize = opts.onResize || this.noop; //窗口resize时调用函数
			this.repeat = opts.repeat || false; //是否可以从最后一页回到第一页
			this.duration = opts.duration || 500;
			this.resizeDelay = opts.resizeDelay || 30;
			this.pager = getById(opts.pager || 'pager');

			this.current = 0;

			this._length = this.$items.length;
			this._size = 0;
			this._itemsState = [];
			this._plantform = isMobile?'mobile':'desktop';

			this._factory = [];
			this.init();
			this.handerTouch();
			this.on('onPresent',this.onPresent);
			this.on('onDismiss',this.onDismiss);
	}

	ScreenSlider.prototype.init = function(){
		this._size = this.orientation === 'vertical'? this.$container.offsetHeight : this.$container.offsetWidth;
		this.plantform = isMobile?'mobile':'desktop';
		this.present(this.current,'noop',true);
		console.log(ielow);
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
		var childrens = getByToggler(el,this._plantform);
		if(immediate){
			handle();
		}else{
			setTimeout(handle,this.duration);
		}

		function handle(){
			for(i=0;i<childrens.length;i++){
				var child = childrens[i];
				var clazz = child.getAttribute('toggler-'+that._plantform);
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

	ScreenSlider.prototype.noop = function(){};

	ScreenSlider.prototype.handerTouch = function(i){
		var that = this;
		var startEvent = isMobile?'touchstart':'mousedown';
		var endEvent = isMobile?'touchend':'mouseup';
		var startPoint,endPoint,target,edgeChange;
		bind(this.$container,startEvent,function(e){
			if(that.orientation === 'vertical'){
				startPoint = getEvent(e).pageY;
			}else{
				startPoint = getEvent(e).pageX;
			}
		});
		bind(this.$container,endEvent,function(e){
			if(that.orientation === 'vertical'){
				endPoint = getEvent(e).pageY;
			}else{
				endPoint = getEvent(e).pageX;
			}
			if(Math.abs(endPoint-startPoint)<10){
				return; //距离太小默认为是点击
			}
			target = (startPoint - endPoint > 0) ? that.current+1 : that.current -1;
			edgeChange = that.repeat && (target<0 || target>=that._length) ? true:false;
			target = target<0?
								(that.repeat?that._length-1:-1):target>=that._length?
									(that.repeat?0:-1):target; //target 返回-1则不做任何变化

			that.moveTo(target,edgeChange);
		});

		bind(global,'resize',function(e){
			debounce(that.resizeDelay,function(){
				that.toggler(that.$items[that.current],'dismiss');
				that._itemsState = [];
				setTimeout(function(){
					that.init();
				},0);
				that.onResize();
			});
		})
	}

	ScreenSlider.prototype.handlerPager = function () {
		if(!this.pager){
			return;
		}
		var pagerList = getByClass(this.pager,"pager-list-item");
		var pagerIndicator =getByClass(this.pager,"pager-current-indicator")[0];
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
			},10) //给一定的时间确保初始化位置完成

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
