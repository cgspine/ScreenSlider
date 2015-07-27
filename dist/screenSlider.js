(function(global,DOC){

	var W3C = DOC.dispatchEvent;
	var hasOwn = Object.prototype.hasOwnProperty;
	var isMobile = /iPad|iPhone|android/i.test(navigator.userAgent);

	/**
	 *
	 * @param receiver
	 * @param supplier
	 * @returns {*}
	 */
	function mix(receiver,supplier){
			var args = [].slice.call(arguments),
					i = 1,
					key,
					ride = typeof args[args.length-1] === 'boolean'?args.pop():true;
			if(args.length === 1){
					receiver =!this.window?this:{};
					i=0;
			}
			while(supplier = args[i++]){
					for(key in supplier){
							if(hasOwn.call(supplier,key) && (ride || (key in supplier))){
									receiver[key] = supplier[key];
							}
					}
			}
			return receiver;
	}

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
    hasclass=function(el,c){classReg(c).test(el.className);}
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

			this._length = this.$items.length;
			this._current = 0;
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
		this.present(this._current,'noop',true);
	}

	ScreenSlider.prototype.present = function(i,type,immediate){
		var that = this;
		this._current = i;
		var item = this.$items[this._current];
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
		that.toggler(item,'present');
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
		for(i=0;i<childrens.length;i++){
			var child = childrens[i];
			var clazz = child.getAttribute('toggler-'+this._plantform);
			clazz = clazz.split(" ");
			for(var i=0;i<clazz.length;i++){
				var cl = clazz[i];
				if(cl == ''){
					continue;
				}
				if(immediate){
					if(type === 'present'){
						addClass(child,cl);
						that.emit('onPresent',that._current);
					}else{
						removeClass(child,cl);
						that.emit('onDismiss',i);
					}
				}else{
					setTimeout(function(){
						if(type === 'present'){
							addClass(child,cl);
							that.emit('onPresent',that._current);
						}else{
							removeClass(child,cl);
							that.emit('onDismiss',i);
						}
					},this.duration);
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
			target = (startPoint - endPoint > 0) ? that._current+1 : that._current -1;
			edgeChange = that.repeat && (target<0 || target>=that._length) ? true:false;
			target = target<0?
								(that.repeat?that._length-1:-1):target>=that._length?
									(that.repeat?0:-1):target; //target 返回-1则不做任何变化

			that.moveTo(target,edgeChange);
		});

		bind(global,'resize',function(e){
			debounce(that.resizeDelay,function(){
				that.toggler(that.$items[that._current],'dismiss');
				that._itemsState = [];
				that.init();
				that.onResize();
			});
		})
	}

	//动画

	ScreenSlider.prototype.moveTo = function(target,edgeChange){
		if(target == -1){
			return;
		}
		var now = this._current;
		var isFront = target - now > 0 ? true : false;
		var dType = isFront?(edgeChange?'frontOut':'backOut'): (edgeChange?'backOut':'frontOut');
		var pType = isFront?(edgeChange?'backIn':'frontIn'): (edgeChange?'frontIn':'backIn');
		this.present(target,pType);
		this.dismiss(now,dType);
	}

	ScreenSlider.prototype.transform  = function(){
		var that = this;
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
			noop :function(item,size){
					var transform = 'translate3d(0, 0, 0)';
					transformWriter(item,transform);
			}
		}
	}

	ScreenSlider.prototype.animByTransform = function(item,start,end){
		var that = this;
		if(this.orientation === 'vertical'){
			var transform = 'translate3d(0, ' + start + 'px, 0)';
			transformWriter(item,transform);
			transitionWriter(item,0);
			//先要初始化位置
			//var tmp = item.style.transform;//读一次元素，强制刷新界面，直接这样不起作用。。
			setTimeout(function(){
				transform = 'translate3d(0, ' + end + 'px, 0)';
				transformWriter(item,transform);
				transitionWriter(item,that.duration);
			},10) //给一定的时间确保初始化位置完成

		}else{
			var transform = 'translate3d('+ start +'px, 0, 0)';
			transitionWriter(item,0);
			transformWriter(item,transform);
			setTimeout(function(){
				transform = 'translate3d('+ end +'px, 0, 0)';
				transformWriter(item,transform);
				transitionWriter(item,that.duration);
			},10)

		}
	}

	function transformWriter(item,transform){
		item.style['-webkit-transform'] = transform;
		item.style.transform = transform;
	}
	function transitionWriter(item,duration){
		item.style['-webkit-transition'] = duration + 'ms';
		item.style.transition = duration + 'ms';
	}

	function getEvent(event){
		return event ? event : window.event;
	}

	function getTarget(event){
		event = getEvent(event);
		return event.target || event.srcElement;
	}

	global.ScreenSlider = ScreenSlider;


})(self,self.document);