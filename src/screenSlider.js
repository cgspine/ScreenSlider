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

	function getById(el,idName){
    if(arguments.length==1){
      idName = el;
      el = DOM;
    }
    return el.getElementById(idName);
  }
  function getByClass(el,className){
    if(arguments.length==1){
      className = el;
      el = DOM;
    }
    return el.getElementsByClassName(className);
  }
	function getByToggler(el,toggler,status){
		if(arguments.length==1){
			toggler = el;
			el = DOM;
		}
		if(DOM.querySelectorAll){
			return el.querySelectorAll('*[toggler-'+ status + ']');
		}else{
			var result = [];
			var children = el.getElementsByTagName(*);
			for (var i = 0; i < children.length; i++) {
				var toggler = children[i].getAttribute('toggler-'+status);
				if(toggler && toggler!=''){
					result.push(children[i]);
				}
			}
		}
	}

  function classReg(className){
    return new RegExp("(^|\\s+)"+className+"(\\s|$)");
  }
  var hasClass,addClass,removeClass,togglerClass;
  if('classList' in dom.documentElement){
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

	function ScreenSlider(opts){
			this.$container = getById(opts.container||'container');
			this.$items = getByClass($container,opts.items||'item');
			this.activeClass = opts.activeClass || 'item-active';
			this.orientation = opts.orientation || 'vertical';
			this.plantform = opts.plantform || 'desktop';
			this.present = opts.present || function(){};
			this.dismiss = opts.dismiss || function(){};
			this.resize = opts.resize || function(){};
			this.repeat = opts.repeat || false;

			this._length = $items.length;
			this._current = 0;

			this._factory = [];

			this.init();
			this.on('present',this.present);
			this.on('dismiss',this.dismiss);
	}

	ScreenSlider.prototype = {
		init:function(){

		},
		present:function(i){
			var item = this.$items[i];
			addClass(item,this.activeClass);
			this.emit('present',i);
		},
		on:function(name,callback){
			if(typeof callback !== 'function'){
				throw 'parameter callback must be a function';
			}else if(this._factory[name]){
				throw 'event'+ name + 'was registered'
			}
			this._factory = callback;
			return this;
		},
		emit:function(name){
			var args = [].prototype.slice.call(arguments).slice(1);
			var callback = this._factory[name];
			if(callback){
				callback.apply(this,args);
			}
		},
	}

	global.ScreenSlider = ScreenSlider;

})(self,self.document);
